import type { Character } from "./character";
import type { Note } from "./note";
import type { Universe } from "./universe";

export interface AppLocation {
    location_id: number;
    universe_id: number;
    user_id: number;
    name: string;
    location_type: LocationType | null;
    description: string | null;
    characters: Character[] | null;
    notes: Note[] | null;
    universe: Universe | null;
}

export interface LocationResponse {
    Message:string;
    Location:AppLocation;
}

export type LocationDraft = Omit<AppLocation, 'location_id'>

export interface LocationState{
    currentLocation: AppLocation | null;
    allLocations: AppLocation[];
    isLoading: boolean;
    error: string | null;
}


export const  LocationTypes = {
    GALAXY : 'Galaxy',
    SYSTEM : 'System',
    PLANET : 'Planet',

    CONTINENT : 'Continent',
    KINGDOM : 'Kingdom',
    STATE : 'State',

    CITY : 'City',
    TOWN : 'Town',
    VILLAGE : 'Village',

    STREET : 'Street',
    BUILDING : 'Building',
    ROOM : 'Room',
    LANDMARK : 'Landmark'
} as const;


export type LocationType = typeof LocationTypes[keyof typeof LocationTypes];