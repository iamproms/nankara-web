"""Pure destination -> shipping-zone-code resolution (spec §11).

The frontend sends an ISO-3166 alpha-2 country code and a state/region string;
this maps them to one of the nine zone codes. Rates live in the database
(`shipping_zones`), keyed by these codes.
"""

NIGERIA = "NG"

# Canonical zone codes (match `shipping_zones.code`).
ZONE_RIVERS = "rivers"
ZONE_LAGOS = "lagos"
ZONE_ABUJA_FCT = "abuja-fct"
ZONE_OTHER_NIGERIA = "other-nigeria"
ZONE_WEST_AFRICA = "west-africa"
ZONE_REST_OF_AFRICA = "rest-of-africa"
ZONE_UNITED_KINGDOM = "united-kingdom"
ZONE_US_CANADA = "us-canada"
ZONE_REST_OF_WORLD = "rest-of-world"

ALL_ZONE_CODES = (
    ZONE_RIVERS,
    ZONE_LAGOS,
    ZONE_ABUJA_FCT,
    ZONE_OTHER_NIGERIA,
    ZONE_WEST_AFRICA,
    ZONE_REST_OF_AFRICA,
    ZONE_UNITED_KINGDOM,
    ZONE_US_CANADA,
    ZONE_REST_OF_WORLD,
)

# Nigerian state name (lower-cased) -> zone. Anything else in Nigeria falls through
# to `other-nigeria`.
_NIGERIA_STATE_ZONES = {
    "rivers": ZONE_RIVERS,
    "lagos": ZONE_LAGOS,
    "fct": ZONE_ABUJA_FCT,
    "abuja": ZONE_ABUJA_FCT,
    "abuja/fct": ZONE_ABUJA_FCT,
    "federal capital territory": ZONE_ABUJA_FCT,
}

# ECOWAS members minus Nigeria (ISO-3166 alpha-2).
_WEST_AFRICAN = frozenset(
    {
        "BJ", "BF", "CV", "CI", "GM", "GH", "GN", "GW",
        "LR", "ML", "NE", "SN", "SL", "TG",
    }
)

# Every African country (ISO-3166 alpha-2). Used to split "rest of Africa" from
# "rest of world".
_AFRICAN = frozenset(
    {
        "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM", "CG",
        "CD", "CI", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN",
        "GW", "KE", "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ",
        "NA", "NE", "NG", "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD",
        "TZ", "TG", "TN", "UG", "ZM", "ZW",
    }
)


def resolve_zone_code(country_code: str, state_region: str | None) -> str:
    """Return the zone code for a destination. Never raises — an unknown country
    resolves to `rest-of-world`; the caller decides whether a live rate exists.
    """
    code = (country_code or "").strip().upper()
    state = (state_region or "").strip().lower()

    if code == NIGERIA:
        return _NIGERIA_STATE_ZONES.get(state, ZONE_OTHER_NIGERIA)
    if code == "GB":
        return ZONE_UNITED_KINGDOM
    if code in {"US", "CA"}:
        return ZONE_US_CANADA
    if code in _WEST_AFRICAN:
        return ZONE_WEST_AFRICA
    if code in _AFRICAN:
        return ZONE_REST_OF_AFRICA
    return ZONE_REST_OF_WORLD
