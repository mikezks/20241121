import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BookingStore, Flight, FlightFilter } from '../../logic-flight';
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
})
export class FlightSearchComponent {
  private store = inject(BookingStore);

  protected filter = this.store.filter;
  protected route = computed(
    () => 'From ' + this.filter().from + ' to ' + this.filter().to + '.'
  );
  protected basket = this.store.basket;
  protected flightResult = this.store.flights;

  constructor() {
    effect(() => console.log(this.route()));
  }

  protected search(filter: FlightFilter): void {
    this.store.setFilter(filter);
    this.store.loadFlights(filter);
  }

  protected delay(flight: Flight): void {
    const oldFlight = flight;
    const oldDate = new Date(oldFlight.date);

    const newDate = new Date(oldDate.getTime() + 1000 * 60 * 5); // Add 5 min
    const newFlight = {
      ...oldFlight,
      date: newDate.toISOString(),
      delayed: true
    };

    this.store.setFlights(
      this.flightResult().map(
        flight => flight.id === newFlight.id ? newFlight : flight
      )
    );
  }

  protected updateBasket(id: number, selected: boolean): void {
    this.store.setBasketId(id, selected);
  }

  protected reset(): void {
    this.store.resetFlights();
  }
}
