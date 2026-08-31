import pytest

from app.shipping.zones import (
    ZONE_ABUJA_FCT,
    ZONE_LAGOS,
    ZONE_OTHER_NIGERIA,
    ZONE_REST_OF_AFRICA,
    ZONE_REST_OF_WORLD,
    ZONE_RIVERS,
    ZONE_UNITED_KINGDOM,
    ZONE_US_CANADA,
    ZONE_WEST_AFRICA,
    resolve_zone_code,
)


@pytest.mark.parametrize(
    ("country", "state", "expected"),
    [
        ("NG", "Rivers", ZONE_RIVERS),
        ("NG", "Lagos", ZONE_LAGOS),
        ("NG", "FCT", ZONE_ABUJA_FCT),
        ("NG", "Federal Capital Territory", ZONE_ABUJA_FCT),
        ("ng", "abuja", ZONE_ABUJA_FCT),
        ("NG", "Kano", ZONE_OTHER_NIGERIA),
        ("NG", "", ZONE_OTHER_NIGERIA),
        ("NG", None, ZONE_OTHER_NIGERIA),
        ("GH", None, ZONE_WEST_AFRICA),
        ("SN", None, ZONE_WEST_AFRICA),
        ("KE", None, ZONE_REST_OF_AFRICA),
        ("ZA", None, ZONE_REST_OF_AFRICA),
        ("GB", None, ZONE_UNITED_KINGDOM),
        ("US", None, ZONE_US_CANADA),
        ("CA", None, ZONE_US_CANADA),
        ("JP", None, ZONE_REST_OF_WORLD),
        ("", None, ZONE_REST_OF_WORLD),
    ],
)
def test_resolve_zone_code(country, state, expected):
    assert resolve_zone_code(country, state) == expected
