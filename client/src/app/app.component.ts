import { Component, ElementRef, ViewChild } from '@angular/core';
import { DecimalPipe, JsonPipe, PercentPipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { ethers } from 'ethers';
import { io, Socket } from 'socket.io-client';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButton, MatFabButton } from '@angular/material/button';
import { GalachainWeb3WalletSigner } from './galachain-web3-wallet-signer.js';
import { emitParticle } from './particle';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatToolbar, JsonPipe, MatIcon, MatFabButton, DecimalPipe, MatButton, PercentPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {

  private readonly wallet: GalachainWeb3WalletSigner;
  private readonly socket: Socket;

  address: string | undefined;
  balance: string | undefined;
  amount = 1;
  pot = 0;
  chance = 0;

  @ViewChild('burnButton') burnButton!: ElementRef

  constructor(private snackBar: MatSnackBar) {

    // If no wallet is present, lets create a random one!
    if (!localStorage['mnemonic']) {
      const randomWallet = ethers.Wallet.createRandom();

      // save it for later
      // TODO this should be stored somewhere more secure
      localStorage['mnemonic'] = randomWallet.mnemonic?.phrase;
    }

    this.wallet = new GalachainWeb3WalletSigner(ethers.HDNodeWallet.fromPhrase(localStorage['mnemonic']));
    this.socket = io({ path: `/socket`, query: { publicKey: this.wallet.uncompressedPublicKey } });

    // Receive updates from server
    this.socket.on('welcome', ({ address }) => this.address = address);
    this.socket.on('balance', balance => this.balance = balance)
    this.socket.on('pot', ({ pot, chance }) => {
      this.pot = pot;
      this.chance = chance;
    })

    // Someone has burned
    this.socket.on('burned', ({ quantity }) => {
      emitParticle(quantity, this.burnButton.nativeElement.getBoundingClientRect(), document.body);
    });

    // Someone has won the pot
    this.socket.on('winner', ({ pot, chance, address }) => {
      if (this.address === address) {
        this.snackBar.open(`💸 YOU WON ${pot} CRC 💸`, undefined, { duration: 10000 });
      } else {
        this.snackBar.open(`${address} WON ${pot}`, undefined, { duration: 2000 });
      }
    });

    // An error was thrown by the server
    this.socket.on('ui-error', ({ error }) => {
      console.error(error);
      this.snackBar.open(error, undefined, {
        duration: 1000
      })
    })
  }

  // Minus button
  decrement() {
    this.amount /= 10;
    if (this.amount < 1) {
      this.amount = 1;
    }
  }

  // Plus button
  increment() {
    this.amount *= 10;
  }

  // Gimme button
  gimme() {
    this.socket.emit('gimme');
  }

  // BIG RED BUTTON
  burn() {

    // Construct a burn DTO client side
    const burnDto = {
      tokenInstances: [
        {
          quantity: this.amount.toString(),
          tokenInstanceKey: {
            collection: 'ChickenRatCoin',
            category: 'Unit',
            type: 'none',
            additionalKey: 'none',
            instance: '0'
          }
        }
      ],
      signature: undefined
    };

    // Sign it
    this.wallet.sign(burnDto);

    // Send it
    this.socket.emit('burn', {
      burnDto
    });
  }
}

