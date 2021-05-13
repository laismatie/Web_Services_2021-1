import {Router} from 'express'
import {unlinkSync} from 'fs'

import { ImageController, ErroDownload } from './../controllers/ImageController';

export const dowloadRouter = Router()

dowloadRouter.get('/:id', async (req,res) => {
    const id = req.params.id

    const bd = req.app.locals.bd
    const imageCtrl = new ImageController(bd)

    try {
        const  caminhoArquivo = await imageCtrl.realizarDownload(id)
        return res.download(caminhoArquivo, ()=>{
            unlinkSync(caminhoArquivo)
        })
    } catch (erro) {
        switch (erro){
            case ErroDownload.ID_INVALIDO:
                return res.status(400).json({mensagem: ErroDownload.ID_INVALIDO})
            case ErroDownload.NAO_FOI_POSSIVEL_GRAVAR:
                return res.status(500).json({mensagem: ErroDownload.NAO_FOI_POSSIVEL_GRAVAR})
            case ErroDownload.NENHUMA_IMAGEM_ENCONTRADA: 
                return res.status(404).json({mensagem: ErroDownload.NENHUMA_IMAGEM_ENCONTRADA}) 
            default:
                return res.status(500).json({mensagem: 'Erro no servidor'})
        }
    }
}) 