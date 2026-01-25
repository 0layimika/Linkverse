import {CreatorRepository} from "../repositories/CreatorRepository";
import {BadRequest, InternalError, Ok} from "@0layimika/api-response-kit";
import {updateSchema} from "../validators/creator.validator";


export class CreatorService {
    static async createCreator(user_id:number,data:any){
        try{
            const existingcreator = await CreatorRepository.getOneWhere({username:data.username});
            if(existingcreator){
                return BadRequest("This username is taken")
            }
            const creator = await CreatorRepository.create({user_id:user_id,...data},{user:true});
            return Ok(creator,"Creator Profile created successfully")
        }catch(err:any){
            return InternalError(err.message)
        }
    }

    static async updateCreator(id:number,data:updateSchema["body"]){
        try{
            const existingcreator = await CreatorRepository.getOneWhere({user_id:id},{user:true})
            if(!existingcreator){
                return BadRequest("User does not exist here")
            }
            if(data.username){
                const usernameexists = await CreatorRepository.getOneWhere({username:data.username});
                if(usernameexists && usernameexists.id!==existingcreator.id){
                    return BadRequest("Username is taken")
                }
            }
            const updated = await CreatorRepository.update(existingcreator.id,data)
            return Ok(updated,"Creator Profile updated successfully")
        }catch(err:any){
            return InternalError(err.message)
        }
    }
}