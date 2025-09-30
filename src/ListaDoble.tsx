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

  // Agregar al final (ya estaba)
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

  // Agregar al inicio
  addFirst(title: string, src: string, image: string) {
    const nuevo = new Nodo(title, src, image);
    if (!this.head) {
      this.head = this.tail = nuevo;
    } else {
      nuevo.next = this.head;
      this.head.prev = nuevo;
      this.head = nuevo;
    }
  }

  // Agregar en cualquier posición (0 = inicio, length = final)
  addAt(title: string, src: string, image: string, index: number) {
    if (index <= 0) {
      this.addFirst(title, src, image);
      return;
    }

    let actual = this.head;
    let i = 0;

    while (actual && i < index) {
      actual = actual.next;
      i++;
    }

    if (!actual) {
      this.add(title, src, image); // si no existe, agregar al final
    } else {
      const nuevo = new Nodo(title, src, image);
      nuevo.prev = actual.prev;
      nuevo.next = actual;

      if (actual.prev) actual.prev.next = nuevo;
      actual.prev = nuevo;

      if (index === 0) this.head = nuevo;
    }
  }

  // Eliminar por título
  remove(title: string): boolean {
    let actual = this.head;

    while (actual) {
      if (actual.title === title) {
        if (actual.prev) actual.prev.next = actual.next;
        else this.head = actual.next;

        if (actual.next) actual.next.prev = actual.prev;
        else this.tail = actual.prev;

        return true;
      }
      actual = actual.next;
    }
    return false;
  }

  // Avanzar
  next(nodo: Nodo | null): Nodo | null {
    return nodo?.next ?? null;
  }

  // Retroceder
  prev(nodo: Nodo | null): Nodo | null {
    return nodo?.prev ?? null;
  }

  // Convertir en array (para pintar en pantalla)
  toArray(): Nodo[] {
    const arr: Nodo[] = [];
    let actual = this.head;
    while (actual) {
      arr.push(actual);
      actual = actual.next;
    }
    return arr;
  }

  // Buscar canción
  find(title: string): Nodo | null {
    let actual = this.head;
    while (actual) {
      if (actual.title === title) return actual;
      actual = actual.next;
    }
    return null;
  }

  // Adelantar canción
  adelantar(nodo: Nodo | null): Nodo | null {
    return this.next(nodo);
  }

  // Retroceder canción
  retroceder(nodo: Nodo | null): Nodo | null {
    return this.prev(nodo);
  }
}