


class Character(db.Model):
    __tablename__ = 'characters'

    character_id: Mapped[int] = mapped_column(primary_key = True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.user_id'), nullable = False)
    name: Mapped[str] = mapped_column(String(100), nullable = False)
    age: Mapped[int] = mapped_column(nullable = True)
    origin: Mapped[str] = mapped_column(String(200), nullable = True)
    main_power_set: Mapped[str] = mapped_column(String(100), nullable = False, unique = True)
    secondary_power_set: Mapped[str] = mapped_column(String(100), nullable = False, unique = True)
    skills: Mapped[str] = mapped_column(Text, nullable = False)

    universes: Mapped[List['Universe']] = relationship(secondary='character_universes', back_populates = 'characters')
    user: Mapped['User']= relationship(back_populates = 'characters')







