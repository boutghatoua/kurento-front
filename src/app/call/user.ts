export class User{
  constructor(name:string){
    this.name=name;
    this.id=Math.random();
  }
  id: number;
  name: string;
}
