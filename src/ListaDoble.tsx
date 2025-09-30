// src/ListaDoble.ts

export class Nodo {
    title: string;
    src: string;
    image: string;
    next: Nodo | null;
    prev: Nodo | null;
  
    constructor(title: string, src: string, image: string) {
      this.title = title;
      this.src = src;
      this.image = image;
      this.next = null;
      this.prev = null;
    }
  }
  
  export class ListaDoble {
    head: Nodo | null = null;
    tail: Nodo | null = null;
  
    add(title: string, src: string, image: string) {
      const nuevo = new Nodo(title, src, image);
      if (!this.head) {
        this.head = this.tail = nuevo;
      } else {
        if (this.tail) {
          this.tail.next = nuevo;
          nuevo.prev = this.tail;
          this.tail = nuevo;
        }
      }
    }
  
    // Avanzar
    next(nodo: Nodo | null): Nodo | null {
      return nodo?.next ?? null;
    }
  
    // Retroceder
    prev(nodo: Nodo | null): Nodo | null {
      return nodo?.prev ?? null;
    }
  
    // Convertir en array (para pintar la lista en pantalla)
    toArray(): Nodo[] {
      const arr: Nodo[] = [];
      let actual = this.head;
      while (actual) {
        arr.push(actual);
        actual = actual.next;
      }
      return arr;
    }
  }
  