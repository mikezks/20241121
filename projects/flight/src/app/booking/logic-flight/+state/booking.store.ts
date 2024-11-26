import { patchState, signalStore, withComputed, withMethods, withState } from "@ngrx/signals";
import { FlightFilter } from "../model/flight-filter";
import { Flight } from "../model/flight";
import { computed, inject } from "@angular/core";
import { FlightService } from "../data-access/flight.service";

type BookingState = {
  filter: FlightFilter;
  basket: Record<number, boolean>;
  flights: Flight[];
};

const initialBookingState: BookingState = {
  filter: {
    from: 'London',
    to: 'Paris',
    urgent: false
  },
  basket: {
    3: true,
    5: true,
  },
  flights: []
};

export const BookingStore = signalStore(
  { providedIn: 'root' },
  withState(initialBookingState),
  withComputed(store => ({
    selectedFlights: computed(
      () => store.flights().filter(flight => store.basket()[flight.id])
    ),
    delayedFlights: computed(
      () => store.flights().filter(flight => flight.delayed)
    ),
  })),
  withMethods((
    store,
    flightService = inject(FlightService)
  ) => ({
    setFlights: (flights: Flight[]) => patchState(store, { flights }),
    resetFlights: () => patchState(store, { flights: [] }),
    loadFlights: (filter: FlightFilter) => {
      flightService.find(filter.from, filter.to, filter.urgent)
        .subscribe(flights => patchState(store, { flights }))
    }
  }))
);
