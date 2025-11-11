import { 
    Entity,
    Column,
    PrimaryGeneratedColumn 
} from 'typeorm';

@Entity( {name: "user"} )
export class UserEntity {

  // example columns from the internet. May not relfect actual entity.
 @PrimaryGeneratedColumn('uuid')
  id?: string; // The ID will be a string type

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ default: true })
  isActive!: boolean;
}
