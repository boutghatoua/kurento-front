import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { CallComponent } from './call/call.component';
import {MatDividerModule} from '@angular/material/divider';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatRadioModule} from '@angular/material/radio';
import {MatCardModule} from '@angular/material/card';
import { CustomMaterialModule } from './material/material.module';
import { FormsModule } from '@angular/forms';
import { RxStompService } from '@stomp/ng2-stompjs';

@NgModule({
  declarations: [
    AppComponent,
    CallComponent
  ],
  imports: [
    BrowserModule,
    MatDividerModule,
    MatGridListModule,
    MatRadioModule,
    MatCardModule,
    CustomMaterialModule,
    FormsModule
  ],
  providers: [RxStompService],
  bootstrap: [AppComponent]
})
export class AppModule { }
