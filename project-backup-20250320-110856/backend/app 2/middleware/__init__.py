"""Middleware package."""

from .demo_protection import protect_demo_user

__all__ = ['protect_demo_user']
