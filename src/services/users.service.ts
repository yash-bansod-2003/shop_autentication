import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
  SaveOptions,
  UpdateResult,
} from "typeorm";
import { User } from "@/entities/user";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";

class UsersService {
  constructor(private readonly usersRepository: Repository<User>) {}
  /**
   * Create a new user in the database.
   *
   * @param createUserDto The User to be created, without an id.
   * @param options The options to be passed to the save method of the repository.
   * @returns A Promise that resolves to the created User.
   */
  async create(createUserDto: DeepPartial<User>, options?: SaveOptions) {
    return await this.usersRepository.save(createUserDto, options);
  }

  /**
   * Retrieve all users from the database.
   *
   * @param options The options to be passed to the find method of the repository.
   * @returns A Promise that resolves to an array of User objects.
   */
  async findAll(options?: FindManyOptions<User>): Promise<[User[], number]> {
    return await this.usersRepository.findAndCount(options);
  }

  /**
   * Retrieve a single user from the database.
   *
   * @param options The options to be passed to the findOne method of the repository.
   * @returns A Promise that resolves to the User, or null if no User matches the criteria.
   */
  async findOne(options: FindOneOptions<User>): Promise<User | null> {
    return await this.usersRepository.findOne(options);
  }

  /**
   * Update a user in the database.
   *
   * @param criteria The criteria to search for the user to be updated.
   * @param userUpdateDto The User object with the changes to be applied.
   * @returns A Promise that resolves to the result of the update operation.
   */
  async update(
    criteria: FindOptionsWhere<User>,
    userUpdateDto: QueryDeepPartialEntity<User>,
  ): Promise<UpdateResult> {
    return await this.usersRepository.update(criteria, userUpdateDto);
  }

  /**
   * Delete a user from the database.
   *
   * @param criteria The criteria to search for the user to be deleted.
   * @returns A Promise that resolves to the result of the delete operation.
   */
  async delete(criteria: FindOptionsWhere<User>): Promise<DeleteResult> {
    return await this.usersRepository.delete(criteria);
  }
}

export default UsersService;
