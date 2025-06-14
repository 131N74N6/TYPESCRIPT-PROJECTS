export interface Activity {
    id: string;
    created_at: Date;
    act_name: string;
}

const Gender = { Male: "Male", Female: "Female" } as const;

export type Gender = typeof Gender[keyof typeof Gender];

export interface NameAndTheirHobbies {
    id: string;
    created_at: Date;
    name: string;
    gender: Gender;
    hobbies: string[];
}