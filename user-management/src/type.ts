enum Gender {
    Male = "Laki-laki",
    Female = "Perempuan"
}

interface UserInfo {
    id: number;
    name: string;
    gender: Gender;
    hobbies: string[];
}

export { Gender, UserInfo }