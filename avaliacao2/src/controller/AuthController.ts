import { NextFunction, Request, Response } from "express"
import { getManager} from "typeorm"
import { verify } from 'jsonwebtoken'

import { STATUS, User } from "../entity/User"
import { SECRET } from "../config/secret"
import { App } from "../entity/App"

export class AuthController {
    entityManager: any

    constructor() {
        this.entityManager = getManager()
    }

    async registerUser(user: User): Promise<User> {
        delete user._password
        try {
            const savedUser = await this.entityManager.save(user)
            return savedUser
        } catch (error) {
            console.log(error)
            throw new Error(error)
        }
    }

    async findUserByEmail(email: string): Promise<User> {
        const user = await this.entityManager.findOne(User, { email: email })
        console.log(user, 'encontrei o usuário')
        return user
    }
    
    async findAppById(id_app: string): Promise<App> {
        const app = await this.entityManager.findOne(App, { id_app: id_app })
        return app
    }

    async associateUserToApp(id_app: string, id:string) {
        await this.entityManager.updateOne(User, {id: id}, {apps: [id_app]})
        await this.entityManager.updateOne(App, {id_app: id_app}, {users:[id]})
    }

    static verifyToken(req: Request, res: Response, next: NextFunction) {
        let token = req.headers['authorization']
        if (token) {
            token = token.substring(7, token.length)

            try {
                verify(token, SECRET)
                next()
            } catch (error) {

            }
        }

        res.status(401).json({ message: STATUS.NOT_AUTHORIZED })
    }

    async registerApp(app: App): Promise<App> {
        try{
            const savedApp = await this.entityManager.save(app)
            return savedApp
        } catch(error){
            console.log(error)
            throw new Error(error)
        }
    }
}