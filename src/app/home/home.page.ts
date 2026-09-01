import {
  Component,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';

import { StorageService } from '../service/storage.service';

type Card = {
  id: number;
  key: string;
  image: string;
  revealed: boolean;
  matched: boolean;
};

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false
})
export class HomePage {

  pairs = 8;

  players = [
    'assets/imagenes/jugador1.png',
    'assets/imagenes/jugador2.png',
    'assets/imagenes/jugador3.png',
    'assets/imagenes/jugador4.png',
    'assets/imagenes/jugador5.png',
    'assets/imagenes/jugador6.png',
    'assets/imagenes/jugador7.png',
    'assets/imagenes/jugador8.png'
  ];

  cards: Card[] = [];

  firstPick: Card | null = null;
  secondPick: Card | null = null;

  boardLocked = false;

  attempts = 0;
  matches = 0;

  bestAtems = 0;

  isNewRecord = false;

  constructor(
    private zone: NgZone,
    private cdRef: ChangeDetectorRef,
    private storageService: StorageService
  ) {}

  async ngOnInit() {

    this.newGame();

    try {

      await this.storageService.init();

      this.bestAtems =
        await this.storageService.getBestAtems();

      this.cdRef.detectChanges();

    } catch (error) {

      console.error(
        'Error inicializando Storage:',
        error
      );

      this.bestAtems = 0;
    }
  }

  newGame() {

    this.attempts = 0;
    this.matches = 0;

    this.firstPick = null;
    this.secondPick = null;

    this.boardLocked = false;

    this.isNewRecord = false;

    const selected =
      this.players.slice(0, this.pairs);

    const deck: Card[] =
      selected.flatMap<Card>((img, i) => [

        {
          id: i * 2,
          key: 'k' + i,
          image: img,
          revealed: false,
          matched: false
        },

        {
          id: i * 2 + 1,
          key: 'k' + i,
          image: img,
          revealed: false,
          matched: false
        }

      ]);

    for (
      let i = deck.length - 1;
      i > 0;
      i--
    ) {

      const j =
        Math.floor(
          Math.random() * (i + 1)
        );

      [deck[i], deck[j]] =
        [deck[j], deck[i]];
    }

    this.cards = deck;

    this.cdRef.detectChanges();
  }

  onCardClick(card: Card) {

    /*
     * IMPORTANTE:
     *
     * Mientras estamos esperando los 800 ms
     * NO permitimos otra carta.
     *
     * Esto significa:
     *
     * carta 1 -> carta 2 -> comprobar -> ocultar
     *
     * Nunca:
     *
     * carta 1 -> carta 2 -> carta 3
     */
    if (this.boardLocked) {
      return;
    }

    // Guarda extra: si ya hay dos cartas seleccionadas
    // (procesándose), nunca se acepta una tercera,
    // incluso si boardLocked no se hubiera actualizado
    // todavía en la vista.
    if (this.firstPick && this.secondPick) {
      return;
    }

    if (card.revealed || card.matched) {
      return;
    }

    // ==========================================
    // PRIMERA CARTA
    // ==========================================

    if (!this.firstPick) {

      card.revealed = true;

      this.firstPick = card;

      this.cdRef.detectChanges();

      return;
    }

    // Evita procesar la misma carta como
    // primera y segunda selección.
    if (card.id === this.firstPick.id) {
      return;
    }

    // ==========================================
    // SEGUNDA CARTA
    // ==========================================

    card.revealed = true;

    this.secondPick = card;

    this.attempts++;

    const firstCard = this.firstPick;
    const secondCard = this.secondPick;

    /*
     * DESDE ESTE MOMENTO EL TABLERO SE BLOQUEA.
     *
     * El usuario NO podrá tocar una tercera carta.
     */
    this.boardLocked = true;

    this.cdRef.detectChanges();

    // ==========================================
    // COMPROBAR PAREJA
    // ==========================================

    const match =
      firstCard.key === secondCard.key;

    if (match) {

      // Las dos quedan permanentemente visibles
      firstCard.matched = true;
      secondCard.matched = true;

      this.matches++;

      // Limpiar selección
      this.firstPick = null;
      this.secondPick = null;

      // Desbloquear inmediatamente
      this.boardLocked = false;

      this.cdRef.detectChanges();

      // Comprobar victoria
      if (this.finished) {
        this.onGameFinish();
      }

      return;
    }

    // ==========================================
    // NO SON PAREJA
    // ==========================================

    /*
     * AQUÍ ESTÁ LA PARTE IMPORTANTE.
     *
     * No esperamos otro click.
     *
     * Las dos cartas se ocultan AUTOMÁTICAMENTE
     * después de 800 ms, sin depender de una
     * tercera interacción del usuario.
     */
    setTimeout(() => {

      this.zone.run(() => {

        firstCard.revealed = false;
        secondCard.revealed = false;

        this.firstPick = null;
        this.secondPick = null;

        this.boardLocked = false;

        this.cdRef.detectChanges();

      });

    }, 800);
  }

  private async onGameFinish() {

    try {

      await this.storageService.saveHistory({

        date: new Date().toString(),

        atems: this.attempts,

        win: true

      });

      const isRecord =
        await this.storageService.saveAtems(
          this.attempts
        );

      if (isRecord) {

        this.bestAtems =
          this.attempts;

        this.isNewRecord = true;

        this.cdRef.detectChanges();
      }

    } catch (error) {

      console.error(
        'Error guardando partida:',
        error
      );
    }
  }

  get finished() {

    return this.matches === this.pairs;
  }
}