def test_quote_nigeria_lagos(client, seeded_zones):
    res = client.post(
        "/api/v1/shipping/quote",
        json={"country_code": "NG", "state_region": "Lagos"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body == {
        "zone_code": "lagos",
        "zone_name": "Lagos",
        "amount": 8000,
        "currency": "NGN",
    }


def test_quote_international(client, seeded_zones):
    res = client.post(
        "/api/v1/shipping/quote",
        json={"country_code": "US", "state_region": "California"},
    )
    assert res.status_code == 200
    assert res.json()["zone_code"] == "us-canada"


def test_quote_unknown_when_not_seeded(client):
    res = client.post(
        "/api/v1/shipping/quote", json={"country_code": "NG", "state_region": "Lagos"}
    )
    assert res.status_code == 422


def test_quote_inactive_zone(client, seeded_zones, db):
    for zone in seeded_zones:
        if zone.code == "lagos":
            zone.is_active = False
    db.flush()
    res = client.post(
        "/api/v1/shipping/quote", json={"country_code": "NG", "state_region": "Lagos"}
    )
    assert res.status_code == 422
