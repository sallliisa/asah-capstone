import calendar
import hashlib
import json
import random
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

from kos_models.features import TenantInput, calculate

SEED = 2992026
ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data"


def month(index, day=1):
    year = 2025 + index // 12
    number = index % 12 + 1
    return date(year, number, min(day, calendar.monthrange(year, number)[1]))


def generate():
    DATA.mkdir(exist_ok=True)
    histories = []
    snapshots = []
    plans = []
    for number in range(600):
        split = "train" if number < 420 else "validation" if number < 510 else "test"
        rng = random.Random(SEED + number * 997)
        tenant = f"synthetic-{number:04d}"
        group = f"{split}-group-{number // 3:03d}"
        family = rng.choices(
            [
                "ordinary",
                "repairs",
                "cleaning",
                "late",
                "unpaid",
                "mixed",
                "recovered",
                "planned",
                "incomplete",
            ],
            [75, 3, 3, 3, 3, 3, 3, 5, 2],
        )[0]
        rooms = [f"{group}-room-{number % 3}", f"{group}-room-{(number + 1) % 3}"]
        moves = rng.random() < 0.3
        multiple = rng.random() < 0.08
        start = month(rng.randrange(0, 4), rng.randrange(1, 21))
        coverage = {
            "repairsFrom": str(start),
            "cleaningFrom": str(start),
            "rentFrom": str(start),
            "repairCostsComplete": True,
        }
        if family == "incomplete":
            coverage["repairCostsComplete"] = False
        raw = []
        rent_amount = rng.choice(
            [1400000, 1500000, 1500000, 1600000, 1600000, 2000000, 2500000]
        )
        anchor = rng.randrange(1, 29)
        review = []
        for index in range(18):
            room = rooms[1] if moves and index >= 9 else rooms[0]
            severity = (
                rng.choice([1, 2])
                if family in ("repairs", "cleaning", "late", "unpaid", "mixed")
                else 0
            )
            if family == "recovered":
                severity = 2 if 4 <= index <= 8 else 0
            active = index >= 4 and severity > 0

            def add(
                category, when, amount=None, payment=None, due=None, financial="expense"
            ):
                raw.append(
                    {
                        "id": f"{tenant}-activity-{len(raw)}",
                        "roomId": room,
                        "categoryId": f"activity-category-{category}",
                        "workStatus": "completed"
                        if category != "room-rent"
                        else "planned",
                        "completedDate": str(when) if category != "room-rent" else None,
                        "financialKind": financial,
                        "amount": amount,
                        "paymentStatus": "settled" if payment else "draft",
                        "paymentDate": str(payment) if payment else None,
                        "occurrenceDate": str(due) if due else None,
                    }
                )

            due = month(index, anchor)
            if due >= start:
                delay = rng.choices([0, 1, 2], [95, 4, 1])[0]
                if active and family in ("late", "mixed", "recovered"):
                    delay = (
                        rng.randrange(4, 12) if severity == 1 else rng.randrange(20, 61)
                    )
                payment = due + timedelta(days=delay)
                if active and family == "unpaid":
                    payment = (
                        None
                        if rng.random() < (0.35 if severity == 1 else 0.8)
                        else payment
                    )
                add("room-rent", due, rent_amount, payment, due, "income")
                plans.append(
                    {
                        "tenantId": tenant,
                        "roomId": room,
                        "occurrenceDate": str(due),
                        "amount": rent_amount,
                    }
                )
            repair_count = int(rng.random() < 0.10)
            extra_count = int(rng.random() < 0.10)
            if active and family in ("repairs", "mixed", "recovered"):
                repair_count = (
                    rng.choice([0, 1, 2]) if severity == 1 else rng.choice([2, 3, 4])
                )
            if active and family in ("cleaning", "mixed"):
                extra_count = (
                    rng.choice([0, 1, 2]) if severity == 1 else rng.choice([2, 3, 4])
                )
            for category, count in [
                ("corrective-repairs", repair_count),
                ("extra-cleaning", extra_count),
                ("routine-cleaning", rng.choice([1, 2, 2, 2, 3])),
                ("scheduled-servicing", int(index % 4 == 0)),
            ]:
                for _ in range(count):
                    when = month(index, rng.randrange(1, 29))
                    if when < start:
                        continue
                    cost = rng.randrange(5, 51) * 10000
                    if category == "corrective-repairs" and rng.random() < 0.04:
                        cost = rng.randrange(50, 201) * 10000
                    if category == "scheduled-servicing" and family == "planned":
                        cost = rng.randrange(100, 300) * 10000
                    add(
                        category, when, cost, when + timedelta(days=rng.randrange(0, 5))
                    )
            review.append(
                {"month": index, "active": active, "scenarioIntensity": severity}
            )
        history = {
            "tenantId": tenant,
            "split": split,
            "generationGroup": group,
            "family": family,
            "rooms": rooms,
            "moved": moves,
            "multipleRooms": multiple,
            "coverage": coverage,
            "activities": raw,
            "review": review,
        }
        if multiple:
            for activity in list(raw):
                if activity["categoryId"].endswith("room-rent"):
                    raw.append(
                        {
                            **activity,
                            "id": activity["id"] + "-second",
                            "roomId": rooms[1],
                        }
                    )
        histories.append(history)
        for index in range(18):
            as_of = month(index, 31)
            visible = [
                a
                for a in raw
                if min(
                    a["completedDate"] or a["occurrenceDate"] or "9999",
                    a["paymentDate"] or "9999",
                )
                <= str(as_of)
            ]
            value = TenantInput.model_validate(
                {
                    "tenantId": tenant,
                    "asOfDate": str(as_of),
                    "coverage": coverage,
                    "recurrenceComplete": True,
                    "activities": visible,
                }
            )
            result = calculate(value)
            selected = [
                a
                for a in raw
                if a["roomId"]
                and (
                    a["completedDate"]
                    and result["windowStart"] <= a["completedDate"] <= str(as_of)
                    or a["occurrenceDate"]
                    and result["windowStart"] <= a["occurrenceDate"] <= str(as_of)
                )
            ]
            recent = str(as_of - timedelta(days=89))
            repairs = [
                a
                for a in selected
                if a["categoryId"].endswith("corrective-repairs")
                and a["completedDate"] >= recent
            ]
            cleanings = [
                a
                for a in selected
                if a["categoryId"].endswith("extra-cleaning")
                and a["completedDate"] >= recent
            ]
            unpaid = [
                a
                for a in selected
                if a["categoryId"].endswith("room-rent")
                and a["occurrenceDate"] < str(as_of)
                and (a["paymentDate"] is None or a["paymentDate"] > str(as_of))
            ]
            late = [
                a
                for a in selected
                if a["categoryId"].endswith("room-rent")
                and a["paymentDate"]
                and a["paymentDate"] <= str(as_of)
                and (
                    date.fromisoformat(a["paymentDate"])
                    - date.fromisoformat(a["occurrenceDate"])
                ).days
                >= 4
            ]
            older = max(
                [
                    (as_of - date.fromisoformat(a["occurrenceDate"])).days
                    for a in unpaid
                ],
                default=0,
            )
            severe = (
                len(repairs) >= 6
                or len(cleanings) >= 6
                or older >= 60
                or len(late) >= 6
            )
            moderate = (
                len(repairs) >= 3
                or len(cleanings) >= 3
                or older >= 14
                or len(late) >= 3
            )
            label = "C" if severe else "B" if moderate else "A"
            snapshots.append(
                {
                    "tenantId": tenant,
                    "split": split,
                    "generationGroup": group,
                    "family": family,
                    "asOfDate": str(as_of),
                    "label": label,
                    "labelRationale": {
                        "repairsLast90": len(repairs),
                        "extraLast90": len(cleanings),
                        "unpaidOver60Days": older >= 60,
                        "settledDelaysAtLeast4Days": len(late),
                    },
                    "input": value.model_dump(mode="json"),
                    **result,
                }
            )
    for name, values in [
        ("histories", histories),
        ("snapshots", snapshots),
        ("plans", plans),
    ]:
        (DATA / f"{name}.jsonl").write_text(
            "".join(json.dumps(v, separators=(",", ":")) + "\n" for v in values)
        )
    manifest = {
        "seed": SEED,
        "tenants": len(histories),
        "snapshots": len(snapshots),
        "splits": dict(Counter(h["split"] for h in histories)),
        "eligibleLabels": dict(
            Counter(s["label"] for s in snapshots if not s["eligibilityReasons"])
        ),
        "sha256": {
            name: hashlib.sha256((DATA / name).read_bytes()).hexdigest()
            for name in ("histories.jsonl", "snapshots.jsonl", "plans.jsonl")
        },
    }
    (DATA / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return manifest


def main():
    print(json.dumps(generate(), indent=2))
