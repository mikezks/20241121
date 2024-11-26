import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FlightService } from '../../api-boarding';
import { Flight, FlightFilter } from '../../logic-flight';
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
  private flightService = inject(FlightService);

  protected filter = signal({
    from: 'London',
    to: 'New York',
    urgent: false
  });
  protected route = computed(
    () => 'From ' + this.filter().from + ' to ' + this.filter().to + '.'
  );
  protected basket: Record<number, boolean> = {
    3: true,
    5: true
  };
  protected flights: Flight[] = [];

  constructor() {
    effect(() => {
      const route = this.route();
      untracked(() => this.logRoute(route));
    });

    console.log(this.filter().from);
    this.filter.update(value => ({ ...value, from: 'Athen' }));
    console.log(this.filter().from);
    this.filter.update(value => ({ ...value, from: 'Barcelona' }));
    console.log(this.filter().from);
    this.filter.update(value => ({ ...value, from: 'Frankfurt' }));
    console.log(this.filter().from);
    this.filter.update(value => ({ ...value, from: 'Dublin' }));
    console.log(this.filter().from);
    this.filter.update(value => ({ ...value, from: 'Oslo' }));
    console.log(this.filter().from);
    this.filter.update(value => ({ ...value, from: 'Madrid' }));
    console.log(this.filter().from);

    // Glitch-free mode
    const counter = signal(0);
    counter.update(num => num + 1);
    const isEven = computed(() => counter() % 2 === 0);
    effect(() => console.log(counter(), 'gerade:', isEven()));
  }

  protected logRoute(route: string): void {
    console.log(route);
  }

  protected search(filter: FlightFilter): void {
    this.filter.set(filter);

    if (!this.filter().from || !this.filter().to) {
      return;
    }

    this.flightService.find(
      this.filter().from, this.filter().to, this.filter().urgent
    ).subscribe(
      flights => this.flights = flights
    );
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

    this.flights = this.flights.map(
      flight => flight.id === newFlight.id ? newFlight : flight
    );
  }

  protected reset(): void {
    this.flights = [];
  }
}
