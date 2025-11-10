import { 
    Entity,
    Column,
    PrimaryGeneratedColumn 
} from 'typeorm';

@Entity( {name: "user"} )
export class UserEntity {
 @PrimaryGeneratedColumn('uuid')
  id?: string; // The ID will be a string type

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;
}
