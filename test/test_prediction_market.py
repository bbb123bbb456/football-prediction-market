import json
import pytest
from gltest import ContractTest


@pytest.fixture
def contract():
    """Contract'ı deploy et ve test için hazırla"""
    ct = ContractTest("contracts/prediction_market.py")
    ct.deploy()
    return ct


def test_get_supported_leagues(contract):
    """Desteklenen ligler dönmeli"""
    result = contract.call("get_supported_leagues")
    leagues = json.loads(result)
    assert "premier_league" in leagues
    assert "la_liga" in leagues
    assert "serie_a" in leagues
    assert "bundesliga" in leagues
    assert "ligue_1" in leagues
    assert len(leagues["premier_league"]) == 5


def test_create_market(contract):
    """Market oluşturulabilmeli"""
    contract.send(
        "create_market",
        "premier_league",
        "Arsenal",
        "Liverpool",
        "2025-12-15",
    )
    result = contract.call("get_all_markets")
    markets = json.loads(result)
    assert len(markets) == 1
    assert markets[0]["home_team"] == "Arsenal"
    assert markets[0]["away_team"] == "Liverpool"
    assert markets[0]["status"] == "open"


def test_create_market_invalid_league(contract):
    """Geçersiz lig reddedilmeli"""
    with pytest.raises(Exception):
        contract.send(
            "create_market",
            "super_lig",          # desteklenmiyor
            "Galatasaray",
            "Fenerbahce",
            "2025-12-15",
        )


def test_create_market_invalid_team(contract):
    """Top 5'te olmayan takım reddedilmeli"""
    with pytest.raises(Exception):
        contract.send(
            "create_market",
            "premier_league",
            "Arsenal",
            "Wolverhampton Wanderers",   # top 5'te değil
            "2025-12-15",
        )


def test_place_bet(contract):
    """Bahis yapılabilmeli"""
    contract.send(
        "create_market",
        "premier_league",
        "Arsenal",
        "Manchester City",
        "2025-12-15",
    )
    contract.send(
        "place_bet",
        "premier_league_arsenal_manchester_city_2025-12-15",
        "home",
    )
    result = contract.call(
        "get_market_bets",
        "premier_league_arsenal_manchester_city_2025-12-15",
    )
    bets = json.loads(result)
    assert len(bets) == 1
    assert bets[0]["prediction"] == "home"


def test_place_bet_invalid_prediction(contract):
    """Geçersiz tahmin reddedilmeli"""
    contract.send(
        "create_market",
        "la_liga",
        "Barcelona",
        "Real Madrid",
        "2025-12-15",
    )
    with pytest.raises(Exception):
        contract.send(
            "place_bet",
            "la_liga_barcelona_real_madrid_2025-12-15",
            "tie",     # yanlış, "draw" olmalı
        )


def test_resolve_market(contract):
    """
    Geçmiş tarihli bir maç resolve edilebilmeli.
    NOT: Bu test web fetch + LLM gerektirdiği için
    Studio'nun çalışıyor olması ve internet erişimi gerekir.
    """
    contract.send(
        "create_market",
        "premier_league",
        "Arsenal",
        "Liverpool",
        "2025-09-28",   # kesin oynanan geçmiş bir tarih
    )
    contract.send(
        "resolve_market",
        "premier_league_arsenal_liverpool_2025-09-28",
    )
    result = contract.call(
        "get_market",
        "premier_league_arsenal_liverpool_2025-09-28",
    )
    market = json.loads(result)
    assert market["status"] == "resolved"
    assert market["outcome"] in ("home", "draw", "away")
    assert market["home_score"] >= 0
    assert market["away_score"] >= 0
