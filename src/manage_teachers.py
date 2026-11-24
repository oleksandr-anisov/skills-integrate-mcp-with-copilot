import getpass
import json
import os
import sys

from app import hash_password, teacher_credentials_file


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python src/manage_teachers.py <username>")

    username = sys.argv[1].strip()
    if not username:
        raise SystemExit("Username cannot be empty.")

    password = getpass.getpass("Teacher password: ")
    if not password:
        raise SystemExit("Password cannot be empty.")
    if password != getpass.getpass("Confirm password: "):
        raise SystemExit("Passwords do not match.")

    try:
        with teacher_credentials_file.open(encoding="utf-8") as file:
            data = json.load(file)
    except FileNotFoundError:
        data = {"teachers": {}}
    except (OSError, json.JSONDecodeError) as error:
        raise SystemExit(f"Could not read teacher accounts: {error}") from error

    teachers = data.get("teachers") if isinstance(data, dict) else None
    if teachers is None:
        teachers = {}
        data = {"teachers": teachers}
    if not isinstance(teachers, dict):
        raise SystemExit("Teacher accounts file has an invalid format.")

    teachers[username] = hash_password(password)
    teacher_credentials_file.parent.mkdir(parents=True, exist_ok=True)
    temporary_file = teacher_credentials_file.with_suffix(
        teacher_credentials_file.suffix + ".tmp"
    )
    temporary_file.write_text(
        json.dumps(data, indent=2) + "\n",
        encoding="utf-8",
    )
    os.chmod(temporary_file, 0o600)
    os.replace(temporary_file, teacher_credentials_file)
    print(f"Teacher account '{username}' saved to {teacher_credentials_file}.")


if __name__ == "__main__":
    main()
