import type { Character } from "./character";
import type { Note } from "./note";
import type { Universe } from "./universe";

export interface AppLocation {
    locationId: number;
    universeId: number;
    userId: number;
    name: string;
    location_type: LocationTypes;
    description: string | null;
    characters: Character[];
    notes: Note[];
    universe: Universe;
}

export type LocationDraft = Omit<AppLocation, 'locationId'>

export interface LocationState{
    currentLocation: AppLocation | null;
    allLocations: AppLocation[];
    isLoading: boolean;
    error: string | null;
}


export enum LocationTypes {
    GALAXY = 'Galaxy',
    SYSTEM = 'System',
    PLANET = 'Planet',

    CONTINENT = 'Continent',
    KINGDOM = 'Kingdom',
    STATE = 'State',

    CITY = 'City',
    TOWN = 'Town',
    VILLAGE = 'Village',

    STREET = 'Street',
    BUILDING = 'Building',
    ROOM = 'Room',
    LANDMARK = 'Landmark'
}