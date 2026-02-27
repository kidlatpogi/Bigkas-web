from __future__ import annotations


def calculate_lock_minutes(failed_attempts: int) -> int:
    """Exponential login backoff policy.

    - 1st-2nd failed attempts: no lock
    - 3rd failed attempt: 5 minutes
    - 4th failed attempt: 15 minutes
    - 5th failed attempt: 30 minutes
    - 6th+ failed attempts: doubles from 30 (60, 120, ...)
    """
    if failed_attempts <= 2:
        return 0
    if failed_attempts == 3:
        return 5
    if failed_attempts == 4:
        return 15
    exponent = max(0, failed_attempts - 5)
    return 30 * (2 ** exponent)
