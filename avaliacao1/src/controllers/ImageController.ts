import { Db, GridFSBucket, ObjectId } from "mongodb" 
import { join } from "path"
import {existsSync, mkdirSync, writeFileSync, createReadStream, unlinkSync, createWriteStream} from "fs"

export enum ErroUpload{
    IMAGEM_INVALIDO = 'Imagem inválido',
    NAO_FOI_POSSIVEL_GRAVAR = 'Não foi possível gravar o arquivo no banco de dados'
}

export enum ErroDownload{
    ID_INVALIDO = 'ID Inválido',
    NENHUMA_IMAGEM_ENCONTRADA = 'Nenhuma imagem encontrada com este id',
    NAO_FOI_POSSIVEL_GRAVAR = 'Não foi possível gravar a imagem recuperada'
}

export class ImageController{
    private _bd: Db
    private _caminhoDiretorioArquivos: string

    constructor(bd: Db){
        this._bd = bd
        this._caminhoDiretorioArquivos = join(__dirname, '..','..','arquivos_temporarios')

        if(!existsSync( this._caminhoDiretorioArquivos)){
            mkdirSync( this._caminhoDiretorioArquivos)
        }
    }

    private _ehUmObjetoArquivoValido(objArquivo:any) :boolean{
        return objArquivo
            && 'name' in objArquivo
            && 'data' in objArquivo
            && objArquivo['name']
            && objArquivo['data']
    }

    private _inicializarBucket(): GridFSBucket{
        return new GridFSBucket(this._bd, {
            bucketName: 'arquivos'
        })
    }

    realizarUpload(objArquivo:any) : Promise<ObjectId>{
        return new Promise((resolve, reject) => {
            if(this._ehUmObjetoArquivoValido(objArquivo)){
                const bucket = this._inicializarBucket()

                const nomeArquivo = objArquivo['name']
                const conteudoArquivo = objArquivo['data']
                const nomeArquivoTemp = `${nomeArquivo}_${(new Date().getTime())}`

                const caminhoArquivoTempp = join(this._caminhoDiretorioArquivos, nomeArquivoTemp)
                writeFileSync(caminhoArquivoTempp, conteudoArquivo)

                const streamGridFS = bucket.openUploadStream(nomeArquivo,{
                    metadata: {
                        mimetype: objArquivo['mimetype']
                    }
                })

                const streamLeitura = createReadStream(caminhoArquivoTempp)
                streamLeitura
                    .pipe(streamGridFS)
                    .on('finish', () =>{
                        unlinkSync(caminhoArquivoTempp)
                        resolve(new ObjectId (`${streamGridFS.id}`))
                    })
                    .on('error', erro =>{
                        console.log(erro)
                        reject(ErroUpload.NAO_FOI_POSSIVEL_GRAVAR)
                    })
            }else{
                reject(ErroUpload.IMAGEM_INVALIDO)
            }
        })
    }

    realizarDownload(id: string): Promise<string>{
        return new Promise( async (resolve, reject) =>{
            if(id && id.length == 24){
                const _id = new ObjectId(id)
                const bucket = this._inicializarBucket()
                const resultados = await bucket.find({'_id' : _id}).toArray()
                if(resultados.length > 0){
                    const metadados = resultados[0]
                    const streamGridFS = bucket.openDownloadStream(_id)
                    const caminhoArquivo = join(this._caminhoDiretorioArquivos, metadados['filename'])
                    const streamGravacao = createWriteStream(caminhoArquivo)
                    streamGridFS
                        .pipe(streamGravacao)
                        .on('finish', ()=>{
                            resolve(caminhoArquivo)
                        })
                        .on('erro', erro => {
                            console.log(erro)
                            reject(ErroDownload.NAO_FOI_POSSIVEL_GRAVAR)
                        })

                }else{
                    reject(ErroDownload.NENHUMA_IMAGEM_ENCONTRADA)
                }

            }else{
                reject(ErroDownload.ID_INVALIDO)
            }
        })
    }
}