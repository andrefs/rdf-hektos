
export default abstract class Store {
  abstract select(query: string): any;
}
