/**
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */

package software.aws.solution.clickstream.common.sensors;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import software.aws.solution.clickstream.common.BaseEventParser;
import software.aws.solution.clickstream.common.ExtraParams;
import software.aws.solution.clickstream.common.ParseDataResult;
import software.aws.solution.clickstream.common.TransformConfig;
import software.aws.solution.clickstream.common.Util;
import software.aws.solution.clickstream.common.model.ClickstreamEvent;
import software.aws.solution.clickstream.common.model.ClickstreamEventPropValue;
import software.aws.solution.clickstream.common.model.ClickstreamItem;
import software.aws.solution.clickstream.common.model.ClickstreamUser;
import software.aws.solution.clickstream.common.model.ClickstreamUserPropValue;
import software.aws.solution.clickstream.common.model.ValueType;
import software.aws.solution.clickstream.common.sensors.event.Item;
import software.aws.solution.clickstream.common.sensors.event.SensorsEvent;

import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static software.aws.solution.clickstream.common.ClickstreamEventParser.EVENT_PAGE_VIEW;
import static software.aws.solution.clickstream.common.ClickstreamEventParser.EVENT_PROFILE_SET;
import static software.aws.solution.clickstream.common.ClickstreamEventParser.EVENT_USER_ENGAGEMENT;
import static software.aws.solution.clickstream.common.Util.convertStringObjectMapToStringEventPropMap;
import static software.aws.solution.clickstream.common.Util.convertStringObjectMapToStringUserPropMap;
import static software.aws.solution.clickstream.common.Util.deCodeUri;
import static software.aws.solution.clickstream.common.Util.decompress;
import static software.aws.solution.clickstream.common.Util.getStackTrace;
import static software.aws.solution.clickstream.common.Util.objectToJsonString;
import static software.aws.solution.clickstream.common.enrich.UAEnrichHelper.UA_STRING;


@Slf4j
public final class SensorsEventParser extends BaseEventParser {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Map<String, String> EVENT_NAME_MAP = createEventNameMap();
    private static final String GZIP_DATA_LIST = "data_list=";
    private static final String GZIP_DATA = "data=";
    private static SensorsEventParser instance;
    private final TransformConfig transformConfig;

    private SensorsEventParser(final TransformConfig transformConfig) {
        this.transformConfig = transformConfig;
    }

    public static SensorsEventParser getInstance() {
        return getInstance(null);
    }

    public static SensorsEventParser getInstance(final TransformConfig transformConfig) {
        if (instance == null) {
            instance = new SensorsEventParser(transformConfig);
        }
        return instance;
    }


    public static Map<String, String> createEventNameMap() {
        Map<String, String> eventNameMap = new HashMap<>();
        eventNameMap.put("page_view", EVENT_PAGE_VIEW);
        eventNameMap.put("login", EVENT_PROFILE_SET);
        eventNameMap.put("user_engagement", EVENT_USER_ENGAGEMENT);
        eventNameMap.put("click", "_click");
        return eventNameMap;
    }

    private static String mapEventName(final SensorsEvent sensorsEvent) {
        return EVENT_NAME_MAP.getOrDefault(sensorsEvent.getEvent(), sensorsEvent.getEvent());
    }

    private static String tryDecompress(final byte[] bytes) {
        String rawStringData = null;
        char firstC = (char) bytes[0];
        char lastC = (char) bytes[bytes.length - 1];
        if ((firstC == '[' && lastC == ']') || (firstC == '{' && lastC == '}')) {
            rawStringData = new String(bytes, StandardCharsets.UTF_8);
        } else {
            rawStringData = decompress(bytes);
        }
        return rawStringData;
    }

    public SensorsEvent ingestDataToEvent(final String inputJson) throws JsonProcessingException {
        return getObjectMapper().readValue(inputJson, SensorsEvent.class);
    }

    @Override
    public ParseDataResult parseData(final String dataString, final ExtraParams extraParams, final int index) throws JsonProcessingException {
        ParseDataResult parseDataResult = new ParseDataResult();
        List<ClickstreamEvent> clickstreamEventList = new ArrayList<>();
        parseDataResult.setClickstreamEventList(clickstreamEventList);
        parseDataResult.setClickstreamItemList(new ArrayList<>());

        log.debug("Parsing data: " + dataString);
        if (dataString == null || dataString.isEmpty()) {
            log.warn("Data field is empty, skipping the row");
            return parseDataResult;
        }
        SensorsEvent sensorsEvent = ingestDataToEvent(dataString);
        if (sensorsEvent.getEvent() == null || sensorsEvent.getEvent().isEmpty()) {
            log.warn("Event name is empty, skipping the row, dataString:" + dataString);
            return parseDataResult;
        }

        ClickstreamEvent clickstreamEvent = getClickstreamEvent(sensorsEvent, index, extraParams);

        clickstreamEventList.add(clickstreamEvent);

        String eventId = clickstreamEvent.getEventId();

        boolean isFirstVisit = false;
        if (sensorsEvent.getProperties() != null) {
            isFirstVisit = sensorsEvent.getProperties().isFirstTime();
        }
        log.info("isFirstVisit: " + isFirstVisit);

        if (isFirstVisit) {
            ClickstreamEvent firstVisitEvent = ClickstreamEvent.deepCopy(clickstreamEvent);
            firstVisitEvent.setEventName("_first_open");
            firstVisitEvent.setEventId(eventId + "-first-open");
            clickstreamEventList.add(firstVisitEvent);
        }

        ClickstreamUser clickstreamUser = getClickstreamUser(sensorsEvent, clickstreamEvent);

        List<ClickstreamItem> clickstreamItemList = getClickstreamItemList(sensorsEvent, clickstreamEvent);

        parseDataResult.setClickstreamEventList(clickstreamEventList);
        parseDataResult.setClickstreamUser(clickstreamUser);
        parseDataResult.setClickstreamItemList(clickstreamItemList);
        return parseDataResult;
    }

    @Override
    public JsonNode getData(final String ingestDataField) throws JsonProcessingException {
        try {
            String rawStringData = ingestDataField.trim();
            if (!rawStringData.startsWith("[") && !rawStringData.startsWith("{")) {
                String base64Data = getBase64Data(rawStringData);
                byte[] bytes = Base64.getDecoder().decode(base64Data);
                rawStringData = tryDecompress(bytes);
            }
            return OBJECT_MAPPER.readTree(rawStringData);
        } catch (Exception e) {
            log.error("Failed to parse data: " + ingestDataField + ", error:" + getStackTrace(e));
            return null;
        }
    }

    @Override
    protected TransformConfig getTransformConfig() {
        return this.transformConfig;
    }

    public String getBase64Data(final String data) {
        String b64Data = null;

        for (String dataItem : data.split("&")) {
            if (dataItem.startsWith(GZIP_DATA_LIST)) {
                b64Data = Util.deCodeUri(dataItem.substring(GZIP_DATA_LIST.length()));
            }
            if (dataItem.startsWith(GZIP_DATA)) {
                b64Data = Util.deCodeUri(dataItem.substring(GZIP_DATA.length()));
            }
            if (b64Data != null) {
                break;
            }
        }

        if (b64Data == null) {
            log.warn("No gzip data " + GZIP_DATA_LIST + " or " + GZIP_DATA + " found in the input data: " + data);
        }
        return b64Data;
    }

    private ClickstreamEvent getClickstreamEvent(final SensorsEvent sensorsEvent, final int index, final ExtraParams extraParams) throws JsonProcessingException {
        ClickstreamEvent clickstreamEvent = new ClickstreamEvent();

        clickstreamEvent.setEventTimestamp(new Timestamp(extraParams.getIngestTimestamp()));

        String eventId = String.format("%s-%s-%s-%s",
                extraParams.getRid(),
                index,
                sensorsEvent.getDistinctId(),
                "x");

        clickstreamEvent.setEventId(eventId);
        clickstreamEvent.setEventTimeMsec(clickstreamEvent.getEventTimestamp().getTime());
        String eventName = mapEventName(sensorsEvent);
        clickstreamEvent.setEventName(eventName);
        clickstreamEvent.setIngestTimeMsec(extraParams.getIngestTimestamp());

        setDeviceInfo(sensorsEvent, clickstreamEvent, extraParams);

        setGeoInfo(sensorsEvent, clickstreamEvent);

        clickstreamEvent.setAppId(extraParams.getAppId());

        String platform = "Web";
        if (sensorsEvent.getProperties().getOs() != null) {
            platform = sensorsEvent.getProperties().getOs().contains("Web") ? "Web" : "Mobile";
        }
        clickstreamEvent.setPlatform(platform);

        clickstreamEvent.setProjectId(extraParams.getProjectId());

        clickstreamEvent.setPageViewPageReferrer(deCodeUri(sensorsEvent.getProperties().getReferrer()));
        clickstreamEvent.setPageViewPageTitle(deCodeUri(sensorsEvent.getProperties().getReferrerTitle()));
        clickstreamEvent.setPageViewPageUrl(deCodeUri(sensorsEvent.getProperties().getUrl()));

        clickstreamEvent.setUserEngagementTimeMsec(sensorsEvent.getProperties().getEventDuration());
        clickstreamEvent.setUserId(sensorsEvent.getAnonymousId());
        clickstreamEvent.setUserPseudoId(sensorsEvent.getDistinctId());
        clickstreamEvent.setSessionStartTimeMsec(sensorsEvent.getTime());

        clickstreamEvent.setIp(extraParams.getIp());
        clickstreamEvent.setUa(extraParams.getUa());

        // customParameters
        Map<String, ClickstreamEventPropValue> customParameters = getEventCustomParameters(sensorsEvent, clickstreamEvent);
        clickstreamEvent.setCustomParameters(customParameters);

        // set traffic source
        if (isDisableTrafficSourceEnrichment()) {
            log.info("Traffic source enrichment is disabled");
        } else {
            setTrafficSourceBySourceParser(clickstreamEvent);
        }

        Map<String, String> processInfo = new HashMap<>();
        processInfo.put("rid", extraParams.getRid());
        processInfo.put("ingest_time", Instant.ofEpochMilli(extraParams.getIngestTimestamp()).toString());
        processInfo.put(INPUT_FILE_NAME, extraParams.getInputFileName());
        clickstreamEvent.setProcessInfo(processInfo);

        return clickstreamEvent;
    }

    private void setDeviceInfo(final SensorsEvent sensorsEvent, final ClickstreamEvent clickstreamEvent, final ExtraParams extraParams) {
        if (sensorsEvent.getProperties() != null) {
            clickstreamEvent.setDeviceMobileBrandName(sensorsEvent.getProperties().getProductName());
            clickstreamEvent.setDeviceMobileModelName(sensorsEvent.getProperties().getProductClassify());

            clickstreamEvent.setDeviceOperatingSystem(sensorsEvent.getProperties().getOs());
            clickstreamEvent.setDeviceOperatingSystemVersion(sensorsEvent.getProperties().getOsVersion());

            clickstreamEvent.setDeviceSystemLanguage(sensorsEvent.getProperties().getBrowserLanguage());
            clickstreamEvent.setDeviceScreenWidth(sensorsEvent.getProperties().getScreenWidth());
            clickstreamEvent.setDeviceScreenHeight(sensorsEvent.getProperties().getScreenHeight());
        }

        Map<String, Object> deviceUaMap = new HashMap<>();
        deviceUaMap.put(UA_STRING, extraParams.getUa());
        clickstreamEvent.setDeviceUa(deviceUaMap);

    }

    private void setGeoInfo(final SensorsEvent sensorsEvent, final ClickstreamEvent clickstreamEvent) {
        if (sensorsEvent.getProperties() != null) {
            clickstreamEvent.setGeoCountry(sensorsEvent.getProperties().getCity());
        }
    }

    private Map<String, ClickstreamEventPropValue> getEventCustomParameters(final SensorsEvent sensorsEvent, final ClickstreamEvent clickstreamEvent) throws JsonProcessingException {
        Map<String, ClickstreamEventPropValue> customParameters = new HashMap<>();
        if (sensorsEvent.getUnknownProperties() != null) {
            customParameters = convertStringObjectMapToStringEventPropMap(sensorsEvent.getUnknownProperties());
            clickstreamEvent.setCustomParameters(customParameters);
        }
        String screenResolution = sensorsEvent.getProperties().getScreenWidth() + "x" + sensorsEvent.getProperties().getScreenHeight();
        customParameters.put("distinct_id", new ClickstreamEventPropValue(sensorsEvent.getDistinctId(), ValueType.STRING));
        customParameters.put("screen_resolution", new ClickstreamEventPropValue(screenResolution, ValueType.STRING));

        if (sensorsEvent.getProperties().getProvince() != null && sensorsEvent.getProperties().getCity() != null) {
            ObjectMapper objectMapper = new ObjectMapper();
            ObjectNode eventObject = objectMapper.createObjectNode();
            ObjectNode locationObject = objectMapper.createObjectNode();

            locationObject.put("province", sensorsEvent.getProperties().getProvince());
            locationObject.put("city", sensorsEvent.getProperties().getCity());

            eventObject.set("event_location", locationObject);
            customParameters.put("event_location",
                    new ClickstreamEventPropValue(objectToJsonString(eventObject), ValueType.OBJECT));
        }
        if (sensorsEvent.getProperties() != null) {
            customParameters.put("properties",
                    new ClickstreamEventPropValue(objectToJsonString(sensorsEvent.getProperties()), ValueType.OBJECT));
        }
        return customParameters;
    }

    private ClickstreamUser getClickstreamUser(final SensorsEvent sensorsEvent, final ClickstreamEvent clickstreamEvent) throws JsonProcessingException {
        ClickstreamUser clickstreamUser = new ClickstreamUser();
        clickstreamUser.setAppId(clickstreamEvent.getAppId());
        clickstreamUser.setEventTimestamp(clickstreamEvent.getEventTimestamp());
        clickstreamUser.setUserPseudoId(clickstreamEvent.getUserPseudoId());

        clickstreamUser.setFirstTouchTimeMsec(sensorsEvent.getTime());

        if (clickstreamUser.getFirstTouchTimeMsec() == null) {
            clickstreamUser.setFirstTouchTimeMsec(clickstreamEvent.getEventTimestamp().getTime());
        }

        clickstreamUser.setFirstVisitDate(new java.sql.Date(clickstreamUser.getFirstTouchTimeMsec())); // NOSONAR

        String pageReferrer = clickstreamEvent.getPageViewPageReferrer();
        String lateReferrer = clickstreamEvent.getPageViewLatestReferrer();
        if (pageReferrer != null) {
            clickstreamUser.setFirstReferrer(pageReferrer);
        } else if (lateReferrer != null) {
            clickstreamUser.setFirstReferrer(lateReferrer);
        }

        clickstreamUser.setFirstTrafficSource(clickstreamEvent.getTrafficSourceSource());
        clickstreamUser.setFirstTrafficMedium(clickstreamEvent.getTrafficSourceMedium());
        clickstreamUser.setFirstTrafficCampaign(clickstreamEvent.getTrafficSourceCampaign());
        clickstreamUser.setFirstTrafficContent(clickstreamEvent.getTrafficSourceContent());
        clickstreamUser.setFirstTrafficTerm(clickstreamEvent.getTrafficSourceTerm());
        clickstreamUser.setFirstTrafficCampaignId(clickstreamEvent.getTrafficSourceCampaignId());
        clickstreamUser.setFirstTrafficClidPlatform(clickstreamEvent.getTrafficSourceClidPlatform());
        clickstreamUser.setFirstTrafficClid(clickstreamEvent.getTrafficSourceClid());
        clickstreamUser.setFirstTrafficChannelGroup(clickstreamEvent.getTrafficSourceChannelGroup());
        clickstreamUser.setFirstTrafficCategory(clickstreamEvent.getTrafficSourceCategory());
        clickstreamUser.setFirstAppInstallSource(clickstreamEvent.getAppInstallSource());


        String userId = sensorsEvent.getProperties().getUserId();
        String userName = sensorsEvent.getProperties().getUserName();
        String userFirstName = sensorsEvent.getProperties().getXTestUser();
        String userLastName = sensorsEvent.getProperties().getXTestUser();
        int age = sensorsEvent.getProperties().getAge();

        Map<String, ClickstreamUserPropValue> csUserProps = new HashMap<>();
        csUserProps.put("user_id", new ClickstreamUserPropValue(userId, ValueType.STRING, null));
        csUserProps.put("username", new ClickstreamUserPropValue(userName, ValueType.STRING, null));
        csUserProps.put("firstName", new ClickstreamUserPropValue(userFirstName, ValueType.STRING, null));
        csUserProps.put("lastName", new ClickstreamUserPropValue(userLastName, ValueType.STRING, null));
        csUserProps.put("age", new ClickstreamUserPropValue(age + "", ValueType.NUMBER, null));

        Map<String, Object> extraUserProps = sensorsEvent.getProperties().getUnknownProperties();
        if (extraUserProps != null) {
            Map<String, ClickstreamUserPropValue> extraUserPropsJsonMap = convertStringObjectMapToStringUserPropMap(extraUserProps);
            csUserProps.putAll(extraUserPropsJsonMap);
        }
        clickstreamUser.setUserProperties(csUserProps);

        clickstreamUser.setEventName(clickstreamEvent.getEventName());

        return clickstreamUser;
    }

    private List<ClickstreamItem> getClickstreamItemList(final SensorsEvent sensorsEvent, final ClickstreamEvent clickstreamEvent) throws JsonProcessingException {
        List<Item> items = sensorsEvent.getItems();
        List<ClickstreamItem> clickstreamItems = new ArrayList<>();

        if (items != null && !items.isEmpty()) {
            for (Item item : items) {
                if (item.getItemId() == null || item.getItemId().isEmpty()) {
                    continue;
                }
                ClickstreamItem clickstreamItem = new ClickstreamItem();
                clickstreamItems.add(clickstreamItem);

                clickstreamItem.setAppId(clickstreamEvent.getAppId());
                clickstreamItem.setEventTimestamp(clickstreamEvent.getEventTimestamp());
                clickstreamItem.setEventId(clickstreamEvent.getEventId());
                clickstreamItem.setEventName(clickstreamEvent.getEventName());
                clickstreamItem.setPlatform(clickstreamEvent.getPlatform());
                clickstreamItem.setUserPseudoId(clickstreamEvent.getUserPseudoId());
                clickstreamItem.setUserId(clickstreamEvent.getUserId());
                clickstreamItem.setItemId(item.getItemId());
                clickstreamItem.setName(item.getItemName());
                clickstreamItem.setPrice(item.getPrice());

                Map<String, Object> itemExtraProps = item.getUnknownProperties();
                if (!itemExtraProps.isEmpty()) {
                    clickstreamItem.setCustomParameters(convertStringObjectMapToStringEventPropMap(itemExtraProps));
                }
            }
        }
        return clickstreamItems;
    }
}
