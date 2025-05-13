import { Injectable } from '@nestjs/common';

export interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable()
export class UserService {
  private users: User[] = [
    { id: 1, name: '홍길동', email: 'hong@example.com' },
    { id: 2, name: '김철수', email: 'kim@example.com' },
    { id: 3, name: '이영희', email: 'lee@example.com' },
  ];

  constructor() {
    console.log('UserService 인스턴스 생성됨');
    console.log('Constructor name:', this.constructor.name);
    console.log('Prototype chain:', Object.getPrototypeOf(this));
  }

  async findAll(): Promise<User[]> {
    console.log('UserService.findAll() 호출됨');
    return this.users;
  }

  findById(id: number): User | undefined {
    console.log(`UserService.findById(${id}) 호출됨`);
    return this.users.find((user) => user.id === id);
  }

  create(user: Omit<User, 'id'>): User {
    console.log(`UserService.create(${JSON.stringify(user)}) 호출됨`);
    const newUser = {
      id: this.users.length + 1,
      ...user,
    };
    this.users.push(newUser);
    return newUser;
  }

  update(id: number, userData: Partial<User>): User | undefined {
    console.log(
      `UserService.update(${id}, ${JSON.stringify(userData)}) 호출됨`,
    );
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) return undefined;

    this.users[userIndex] = { ...this.users[userIndex], ...userData };
    return this.users[userIndex];
  }

  delete(id: number): boolean {
    console.log(`UserService.delete(${id}) 호출됨`);
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) return false;

    this.users.splice(userIndex, 1);
    return true;
  }
}
