from math import log1p

import pytest

from kos_models.features import TenantInput, calculate


def activity(identifier, category, **values):
    return {
        "id": identifier,
        "roomId": "old-room",
        "categoryId": f"activity-category-{category}",
        "workStatus": "planned",
        "financialKind": "income" if category == "room-rent" else "expense",
        "amount": 100,
        "paymentStatus": "draft",
        **values,
    }


def snapshot(records, **changes):
    return TenantInput.model_validate(
        {
            "tenantId": "tenant",
            "asOfDate": "2026-03-31",
            "coverage": {
                "repairsFrom": "2026-01-01",
                "cleaningFrom": "2026-01-01",
                "rentFrom": "2026-01-01",
                "repairCostsComplete": True,
            },
            "recurrenceComplete": True,
            "activities": records,
            **changes,
        }
    )


def rents():
    return [
        activity(
            "jan",
            "room-rent",
            occurrenceDate="2026-01-01",
            paymentStatus="settled",
            paymentDate="2026-01-02",
        ),
        activity(
            "feb",
            "room-rent",
            occurrenceDate="2026-02-01",
            paymentStatus="settled",
            paymentDate="2026-04-01",
        ),
        activity("mar", "room-rent", occurrenceDate="2026-03-31"),
    ]


def test_cash_and_work_dates_remain_independent_across_room_moves():
    records = rents() + [
        activity(
            "old-repair",
            "corrective-repairs",
            workStatus="completed",
            completedDate="2025-12-01",
            paymentStatus="settled",
            paymentDate="2026-02-01",
            amount=300,
        ),
        activity(
            "new-repair",
            "corrective-repairs",
            roomId="new-room",
            workStatus="completed",
            completedDate="2026-03-31",
            paymentStatus="settled",
            paymentDate="2026-04-01",
            amount=900,
        ),
        activity(
            "future-repair",
            "corrective-repairs",
            workStatus="completed",
            completedDate="2026-04-01",
        ),
        activity(
            "planned-ac",
            "scheduled-servicing",
            workStatus="completed",
            completedDate="2026-03-01",
            paymentStatus="settled",
            paymentDate="2026-03-01",
            amount=9000000,
        ),
        activity(
            "routine",
            "routine-cleaning",
            workStatus="completed",
            completedDate="2026-03-01",
        ),
    ]
    result = calculate(snapshot(records))
    assert result["eligibilityReasons"] == []
    assert result["observedDays"] == 90
    assert result["features"] == pytest.approx(
        {
            "repairCount90": 1,
            "repairRate30": 1 / 3,
            "repairSpend30Log": log1p(100),
            "extraCleaningCount90": 0,
            "extraCleaningRate30": 0,
            "rentLateShare": 2 / 3,
            "meanSettledLateDays": 1,
            "oldestUnpaidDays": 58,
            "overdueAmountShare": 1 / 3,
        }
    )
    assert result["facts"][0]["activityIds"] == ["new-repair"]


def test_unknown_coverage_is_not_a_zero_incident_result():
    value = snapshot(
        rents()
        + [
            activity(
                "recorded-repair",
                "corrective-repairs",
                workStatus="completed",
                completedDate="2026-03-01",
            )
        ],
        coverage={
            "repairsFrom": None,
            "cleaningFrom": "2026-02-01",
            "rentFrom": "2026-01-01",
            "repairCostsComplete": False,
        },
        recurrenceComplete=False,
    )
    result = calculate(value)
    assert set(result["eligibilityReasons"]) == {
        "missing_repairs_coverage",
        "incomplete_repair_costs",
        "incomplete_recurrence",
        "less_than_90_days",
        "less_than_3_due_rents",
    }
    assert result["features"] is None
    assert result["facts"][0] == {
        "kind": "repairs90",
        "value": 1,
        "activityIds": ["recorded-repair"],
    }


def test_one_day_delay_has_no_grace_and_settling_does_not_erase_lateness():
    records = rents()
    records[1].update(paymentDate="2026-02-02")
    result = calculate(snapshot(records))
    assert result["features"]["rentLateShare"] == pytest.approx(2 / 3)
    assert result["features"]["meanSettledLateDays"] == 1
    assert result["features"]["oldestUnpaidDays"] == 0
    assert result["features"]["overdueAmountShare"] == 0


def test_calendar_window_uses_calendar_year_and_requires_three_due_rents():
    records = [
        activity(
            f"rent-{month}",
            "room-rent",
            occurrenceDate=f"2024-{month:02d}-01",
            paymentStatus="settled",
            paymentDate=f"2024-{month:02d}-01",
        )
        for month in (1, 2, 3)
    ]
    records += [
        activity(
            "edge", "extra-cleaning", workStatus="completed", completedDate="2024-03-01"
        ),
        activity(
            "outside",
            "extra-cleaning",
            workStatus="completed",
            completedDate="2024-02-29",
        ),
    ]
    value = snapshot(
        records,
        asOfDate="2025-02-28",
        coverage={
            "repairsFrom": "2023-01-01",
            "cleaningFrom": "2023-01-01",
            "rentFrom": "2023-01-01",
            "repairCostsComplete": True,
        },
    )
    result = calculate(value)
    assert result["windowStart"] == "2024-02-29"
    assert "less_than_3_due_rents" in result["eligibilityReasons"]
