import calendar
from datetime import date, timedelta
from math import log1p
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

FEATURE_VERSION = "tenant-v1"
FEATURE_NAMES = (
    "repairCount90",
    "repairRate30",
    "repairSpend30Log",
    "extraCleaningCount90",
    "extraCleaningRate30",
    "rentLateShare",
    "meanSettledLateDays",
    "oldestUnpaidDays",
    "overdueAmountShare",
)
BASELINE_NAMES = (
    "repairCount",
    "repairSpend",
    "extraCleaningCount",
    "settledLateCount",
    "oldestUnpaidDays",
    "overdueAmount",
)


class Coverage(BaseModel):
    model_config = ConfigDict(extra="forbid")
    repairsFrom: date | None = None
    cleaningFrom: date | None = None
    rentFrom: date | None = None
    repairCostsComplete: bool = False


class Activity(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str
    roomId: str | None
    categoryId: str
    workStatus: Literal["planned", "in_progress", "completed", "cancelled"]
    completedDate: date | None = None
    financialKind: Literal["none", "income", "expense"]
    amount: int | None = Field(default=None, ge=0)
    paymentStatus: Literal["draft", "settled"] | None = None
    paymentDate: date | None = None
    occurrenceDate: date | None = None


class TenantInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tenantId: str
    asOfDate: date
    coverage: Coverage
    recurrenceComplete: bool
    activities: list[Activity] = Field(max_length=10000)


def previous_year(value: date) -> date:
    year = value.year - 1
    return value.replace(
        year=year, day=min(value.day, calendar.monthrange(year, value.month)[1])
    )


def calculate(value: TenantInput) -> dict:
    end = value.asOfDate
    coverage = value.coverage
    dates = [coverage.repairsFrom, coverage.cleaningFrom, coverage.rentFrom]
    missing = []
    for name, start in zip(("repairs", "cleaning", "rent"), dates):
        if start is None:
            missing.append(f"missing_{name}_coverage")
    if not coverage.repairCostsComplete:
        missing.append("incomplete_repair_costs")
    if not value.recurrenceComplete:
        missing.append("incomplete_recurrence")
    start = max(
        [previous_year(end) + timedelta(days=1)] + [d for d in dates if d is not None]
    )
    days = max(0, (end - start).days + 1)
    if days < 90:
        missing.append("less_than_90_days")
    short = max(start, end - timedelta(days=89))
    activities = list(
        {a.id: a for a in value.activities if a.roomId is not None}.values()
    )
    repairs = [
        a for a in activities if a.categoryId == "activity-category-corrective-repairs"
    ]
    extra = [
        a for a in activities if a.categoryId == "activity-category-extra-cleaning"
    ]
    rent = [
        a
        for a in activities
        if a.categoryId == "activity-category-room-rent"
        and a.financialKind == "income"
        and a.occurrenceDate is not None
        and start <= a.occurrenceDate <= end
    ]
    if len(rent) < 3:
        missing.append("less_than_3_due_rents")
    if any(a.amount is None for a in rent):
        missing.append("unknown_rent_amount")
    if any(
        a.financialKind == "expense" and a.amount is None
        for a in repairs
        if a.paymentStatus == "settled"
        and a.paymentDate is not None
        and start <= a.paymentDate <= end
    ):
        missing.append("unknown_repair_amount")
    result = {
        "tenantId": value.tenantId,
        "asOfDate": end.isoformat(),
        "windowStart": start.isoformat(),
        "observedDays": days,
        "featureVersion": FEATURE_VERSION,
        "eligibilityReasons": missing,
        "features": None,
        "baseline": None,
    }

    def completed(rows, since):
        return [
            a
            for a in rows
            if a.workStatus == "completed"
            and a.completedDate is not None
            and since <= a.completedDate <= end
        ]

    repair90 = completed(repairs, short)
    extra90 = completed(extra, short)
    result["facts"] = [
        {
            "kind": "repairs90",
            "value": len(repair90),
            "activityIds": [a.id for a in repair90],
        },
        {
            "kind": "extraCleaning90",
            "value": len(extra90),
            "activityIds": [a.id for a in extra90],
        },
    ]
    if missing:
        return result

    done_repairs = completed(repairs, start)
    done_extra = completed(extra, start)
    spend = sum(
        a.amount or 0
        for a in repairs
        if a.financialKind == "expense"
        and a.paymentStatus == "settled"
        and a.paymentDate is not None
        and start <= a.paymentDate <= end
    )
    late = []
    unpaid = []
    for activity in rent:
        settled = (
            activity.paymentStatus == "settled"
            and activity.paymentDate is not None
            and activity.paymentDate <= end
        )
        if settled:
            delay = (activity.paymentDate - activity.occurrenceDate).days
            if delay > 0:
                late.append(delay)
        elif activity.occurrenceDate < end:
            unpaid.append(activity)
    overdue = sum(a.amount or 0 for a in unpaid)
    expected = sum(a.amount or 0 for a in rent)
    oldest = max([(end - a.occurrenceDate).days for a in unpaid], default=0)
    result["facts"].append(
        {
            "kind": "oldestUnpaidDays",
            "value": oldest,
            "activityIds": [a.id for a in unpaid],
        }
    )

    result["features"] = dict(
        zip(
            FEATURE_NAMES,
            [
                len(repair90),
                len(done_repairs) * 30 / days,
                log1p(spend * 30 / days),
                len(extra90),
                len(done_extra) * 30 / days,
                (len(late) + len(unpaid)) / len(rent),
                sum(late) / len(late) if late else 0,
                oldest,
                overdue / expected if expected else 0,
            ],
        )
    )
    result["baseline"] = dict(
        zip(
            BASELINE_NAMES,
            [len(done_repairs), spend, len(done_extra), len(late), oldest, overdue],
        )
    )
    return result
