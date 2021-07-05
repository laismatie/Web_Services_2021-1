import { User } from './User';
import {Entity, Column, ManyToMany, JoinTable, PrimaryGeneratedColumn } from "typeorm";

export enum STATUSAPP {
    INVALID_SECRET = 'Invalid secret, this secret is already in use',
    OK = 'Secret successfully registered',
    INVALID_ID = 'The IDs do not match',
    NOT_AUTHORIZED = 'User not authorized',
    REGISTER_ERROR = 'App has not been registered'
}

@Entity()
export class App {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true})
    id_app: string

    @Column()
    secret: string;

    @Column()
    expiresIn: string;

    @ManyToMany(() => User)
    @JoinTable()
    users: User[]

   
    constructor(id_app: string, secret: string, expiresIn: string){
        this.id_app = id_app
        this.secret = secret
        this.expiresIn = expiresIn
    }

    isValid(): STATUSAPP {

        return STATUSAPP.OK
    }
}
