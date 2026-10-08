"""
Seed standard demo accounts (doctor, nurse, cho, admin) into the configured database.
"""

import asyncio
import os
import sys

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from careintel.application.auth.password_hasher import PasswordHasher
from careintel.core.config import get_settings
from careintel.persistence.models.user import RoleORM, UserORM, UserRoleORM

DEMO_ACCOUNTS = [
    {
        "email": "doctor@careintel.local",
        "display_name": "Dr. Sarah Rao",
        "role_name": "doctor",
        "password": "demo123",
    },
    {
        "email": "nurse@careintel.local",
        "display_name": "Nurse Maya Patel",
        "role_name": "nurse",
        "password": "demo123",
    },
    {
        "email": "cho@careintel.local",
        "display_name": "CHO Rajesh Kumar",
        "role_name": "health_worker",
        "password": "demo123",
    },
    {
        "email": "admin@careintel.local",
        "display_name": "System Administrator",
        "role_name": "admin",
        "password": "demo123",
    },
]


async def main() -> None:
    settings = get_settings()
    hasher = PasswordHasher()

    engine = create_async_engine(settings.database_url.get_secret_value(), echo=False)
    session_factory = async_sessionmaker(bind=engine, expire_on_commit=False)

    async with session_factory() as session:
        for account in DEMO_ACCOUNTS:
            email = account["email"]
            display_name = account["display_name"]
            role_name = account["role_name"]
            password = account["password"]
            hashed_password = hasher.hash(password)

            # Check user
            stmt = select(UserORM).where(UserORM.email == email)
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()

            if user:
                print(f"User {email} exists. Updating credentials.")
                user.password_hash = hashed_password
                user.is_active = True
                user.is_verified = True
            else:
                print(f"Creating user {email}...")
                user = UserORM(
                    email=email,
                    display_name=display_name,
                    password_hash=hashed_password,
                    is_active=True,
                    is_verified=True,
                )
                session.add(user)
                await session.flush()

            # Find role
            role_stmt = select(RoleORM).where(RoleORM.name == role_name)
            role_result = await session.execute(role_stmt)
            role = role_result.scalar_one_or_none()
            if not role:
                print(f"Warning: Role {role_name} not found!")
                continue

            # Ensure user has role
            ur_stmt = select(UserRoleORM).where(
                UserRoleORM.user_id == user.id, UserRoleORM.role_id == role.id
            )
            ur_result = await session.execute(ur_stmt)
            ur = ur_result.scalar_one_or_none()
            if not ur:
                print(f"Assigning role {role_name} to {email}...")
                session.add(UserRoleORM(user_id=user.id, role_id=role.id))

        await session.commit()

        from sqlalchemy import text
        await session.execute(text(
            "INSERT INTO role_permissions (role_id, permission_id) "
            "SELECT r.id, p.id FROM roles r CROSS JOIN permissions p "
            "WHERE r.name IN ('nurse', 'health_worker') AND p.code = 'review:write' "
            "ON CONFLICT DO NOTHING;"
        ))
        await session.commit()
        res = await session.execute(text(
            "SELECT r.name, count(p.code) FROM roles r "
            "LEFT JOIN role_permissions rp ON r.id = rp.role_id "
            "LEFT JOIN permissions p ON rp.permission_id = p.id "
            "GROUP BY r.name ORDER BY r.name;"
        ))
        print("\nRole Permission Summary in Database:")
        for row in res.fetchall():
            print(f" - {row[0]:<15}: {row[1]} permissions")

        print("\nDemo accounts seeding and permission verification completed successfully.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
