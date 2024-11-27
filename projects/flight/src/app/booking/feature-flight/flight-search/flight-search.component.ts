import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookingStore, Flight } from '../../logic-flight';
import { FlightCardComponent, FlightFilterComponent } from '../../ui-flight';


@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FlightCardComponent,
    FlightFilterComponent
  ],
  selector: 'app-flight-search',
  templateUrl: './flight-search.component.html',
  providers: [
    // BookingStore
  ]
})
export class FlightSearchComponent {
  protected store = inject(BookingStore);

  protected delay(flight: Flight): void {
    this.store.saveFlightUpdate({
      ...flight,
      date: new Date(new Date(flight.date).getTime() + 1000 * 60 * 5).toISOString(),
      delayed: true
    });
  }
}
