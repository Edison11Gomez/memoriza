import { Component, NgZone, ChangeDetectorRef } from '@angular/core';

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
  standalone: false,
})
export class HomePage {

  pairs = 8;

  players = [
    'assets/imagenes/jugador1.png',
    'assets/imagenes/jugador3.png',
    'assets/imagenes/jugador4.png',
    'assets/imagenes/jugador5.png',
    'assets/imagenes/jugador7.png',
    'assets/imagenes/jugador8.png',
    'assets/imagenes/jugador9.png',
    'assets/imagenes/jugador10.png'
  ];

  cards: Card[] = [];

  firstPick: Card | null = null;
  secondPick: Card | null = null;

  boardLocked = false;

  attempts = 0;
  matches = 0;

  constructor(
    private zone: NgZone,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.newGame();
  }

  newGame() {
    this.attempts = 0;
    this.matches = 0;
    this.firstPick = null;
    this.secondPick = null;
    this.boardLocked = false;

    const selected = this.players.slice(0, this.pairs);

    const deck: Card[] = selected.flatMap<Card>((img, i) => [
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

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    this.cards = deck;
  }

  onCardClick(card: Card) {
    if (this.boardLocked) {
      return;
    }

    if (card.revealed || card.matched) {
      return;
    }

    card.revealed = true;

    if (!this.firstPick) {
      this.firstPick = card;
      this.cdRef.detectChanges();
      return;
    }

    this.secondPick = card;
    this.attempts++;

    const firstCard = this.firstPick;
    const secondCard = this.secondPick;

    this.boardLocked = true;

    if (firstCard.key === secondCard.key) {
      firstCard.matched = true;
      secondCard.matched = true;

      this.matches++;

      this.firstPick = null;
      this.secondPick = null;
      this.boardLocked = false;

      this.cdRef.detectChanges();
    } else {
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
  }

  get finished(): boolean {
    return this.matches === this.pairs;
  }
}