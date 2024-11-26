import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { tapResponse } from "@ngrx/operators";
import { FlightFilter } from "../model/flight-filter";
import { Flight } from "../model/flight";
import { computed, inject } from "@angular/core";
import { FlightService } from "../data-access/flight.service";
import { pipe, switchMap } from "rxjs";

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
  /**
   * State Definition
   */
  withState(initialBookingState),
  /**
   * Derived State
   */
  withComputed(store => ({
    selectedFlights: computed(
      () => store.flights().filter(flight => store.basket()[flight.id])
    ),
    delayedFlights: computed(
      () => store.flights().filter(flight => flight.delayed)
    ),
    route: computed(
      () => 'From ' + store.filter().from + ' to ' + store.filter().to + '.'
    ),
  })),
  /**
   * Updater
   */
  withMethods(store => ({
    setFilter: (filter: FlightFilter) => patchState(store, { filter }),
    setFlights: (flights: Flight[]) => patchState(store, { flights }),
    updateFlights: (updatedFlight: Flight) => patchState(store, state => ({
      flights: state.flights.map(
        flight => flight.id === updatedFlight.id ? updatedFlight : flight
      )
    })),
    setBasketId: (id: number, selected: boolean) => patchState(store, state => ({
      basket: {
        ...state.basket,
        [id]: selected
      }
    })),
    resetFlights: () => patchState(store, { flights: [] }),
  })),
  /**
   * Side-Effects
   */
  withMethods((
    store,
    flightService = inject(FlightService)
  ) => ({
    loadFlights: (filter: FlightFilter) => {
      if (!filter.from || !filter.to) {
        return;
      }

      flightService.find(filter.from, filter.to, filter.urgent)
        .subscribe(flights => store.setFlights(flights));
    },
    loadRxFlights: rxMethod<FlightFilter>(pipe(
      switchMap(filter => flightService.find(
        filter.from, filter.to, filter.urgent
      )),
      tapResponse(
        flights => store.setFlights(flights),
        err => console.error(err)
      )
    ))
  })),
  withHooks({
    onInit: store => store.loadRxFlights(store.filter)
  })
);
