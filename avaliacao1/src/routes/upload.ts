import {Router} from 'express'
import * as path from 'path'
import * as fs from 'fs'

import { ImageController, ErroUpload} from './../controllers/ImageController';
export const uploadRouter = Router()


uploadRouter.post('/', async (req, res) =>{
    if(!req.files || Object.keys(req.files).length == 0){
        return res.status(400).send('Nenhum image recebido')
    }

    const nomesimages = Object.keys(req.files)
    const diretorio = path.join(__dirname, '..','..','pasta_temporarias')

    if(!fs.existsSync(diretorio)){
        fs.mkdirSync(diretorio)
    }

    const bd = req.app.locals.bd
    const imageCtrl = new ImageController(bd)
    const idsImagesSalvos = []
    let quantidadeErrosGravacao = 0
    let quantidadeErrosObjImageInvalido = 0
    let quantidadeErroInesperado = 0

    const promises = nomesimages.map( async (image) => {
        const objImage = req.files[image]
        try {
            const idImage = await imageCtrl.realizarUpload(objImage)
            idsImagesSalvos.push(idImage)
        } catch (erro) {
            switch(erro){
                case ErroUpload.NAO_FOI_POSSIVEL_GRAVAR:
                    quantidadeErrosGravacao++
                    break
                case ErroUpload.IMAGEM_INVALIDO:
                    quantidadeErrosObjImageInvalido++
                    break
                default:
                    quantidadeErroInesperado++
            }
        }
    })
    await Promise.all(promises)
    res.json({
        idsImagesSalvos,
        quantidadeErrosGravacao,
        quantidadeErroInesperado,
        quantidadeErrosObjImageInvalido
    })
})