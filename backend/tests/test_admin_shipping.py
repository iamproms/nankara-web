def test_list_requires_auth(client, seeded_zones):
    assert client.get("/api/v1/admin/shipping-zones").status_code in (401, 403)


def test_list_returns_zones(client, seeded_zones, auth_headers):
    res = client.get("/api/v1/admin/shipping-zones", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert len(body) == len(seeded_zones)
    assert {z["code"] for z in body} >= {"lagos", "us-canada", "rest-of-world"}


def test_patch_rate_and_active(client, seeded_zones, auth_headers, db):
    lagos = next(z for z in seeded_zones if z.code == "lagos")

    res = client.patch(
        f"/api/v1/admin/shipping-zones/{lagos.id}",
        headers=auth_headers,
        json={"rate": 12500, "is_active": False},
    )
    assert res.status_code == 200
    assert res.json()["rate"] == 12500
    assert res.json()["is_active"] is False

    # The public quote now refuses this destination.
    quote = client.post(
        "/api/v1/shipping/quote",
        json={"country_code": "NG", "state_region": "Lagos"},
    )
    assert quote.status_code == 422


def test_patch_unknown_zone(client, auth_headers):
    res = client.patch(
        "/api/v1/admin/shipping-zones/999999",
        headers=auth_headers,
        json={"rate": 1000},
    )
    assert res.status_code == 404
