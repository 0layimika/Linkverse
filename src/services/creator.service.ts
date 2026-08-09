import {CreatorRepository} from "../repositories/CreatorRepository";
import {BadRequest, InternalError, Ok} from "@0layimika/api-response-kit";
import {updateSchema} from "../validators/creator.validator";
import { normalizeDisplayName } from "../utils/display-name";
import { normalizeUsername } from "../utils/username";


export class CreatorService {
    static async createCreator(user_id:number,data:any){
        try{
            const username = normalizeUsername(data.username);
            const existingcreator = await CreatorRepository.findByUsername(username);
            if(existingcreator){
                return BadRequest("This username is taken")
            }
            const creator = await CreatorRepository.create({
                user_id,
                ...data,
                username,
                display_name: normalizeDisplayName(data.display_name),
            },{user:true});
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
            if(data.username !== undefined){
                const username = normalizeUsername(data.username);
                const usernameexists = await CreatorRepository.findByUsername(username);
                if(usernameexists && usernameexists.id!==existingcreator.id){
                    return BadRequest("Username is taken")
                }
            }
            const displayName = normalizeDisplayName(data.display_name);
            const updated = await CreatorRepository.update(existingcreator.id, {
                ...data,
                ...(data.username === undefined ? {} : { username: normalizeUsername(data.username) }),
                ...(displayName === undefined ? {} : { display_name: displayName }),
            })
            return Ok(updated,"Creator Profile updated successfully")
        }catch(err:any){
            return InternalError(err.message)
        }
    }
}
