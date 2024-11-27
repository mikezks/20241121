import { computed, inject } from "@angular/core";
import { tapResponse } from "@ngrx/operators";
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { filter, pipe, switchMap } from "rxjs";
import { Flight, initialFlight } from "../model/flight";
import { FlightFilter } from "../model/flight-filter";
import { FlightService } from './../data-access/flight.service';

type BookingState = {
  filter: FlightFilter;
  basket: Record<number, boolean>;
  flights: Flight[];
  activeFlightId: number;
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
  flights: [],
  activeFlightId: 0,
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
    // Because of the local cache, Flight Search Component needs to read flights that match the filter (not all)
    filteredFlights: computed(
      () => store.flights().filter(flight =>
        flight.from.startsWith(store.filter.from())
        && flight.to.startsWith(store.filter.to())
      )
    ),
    selectedFlights: computed(
      () => store.flights().filter(flight => store.basket()[flight.id])
    ),
    delayedFlights: computed(
      () => store.flights().filter(flight => flight.delayed)
    ),
    route: computed(
      () => 'From ' + store.filter().from + ' to ' + store.filter().to + '.'
    ),
    activeFlight: computed(
      () => store.flights().find(flight => flight.id === store.activeFlightId()) || initialFlight
    )
  })),
  /**
   * Updater
   */
  withMethods(store => ({
    setFilter: (filter: FlightFilter) => patchState(store, { filter }),
    // Creates a local cache, but EntityState would allow more performat updates
    updateFlights: (flights: Flight[]) => patchState(store, state => {
      const flightIds = flights.map(flight => flight.id);
      return {
        flights: [
          ...state.flights.filter(flight => !flightIds.includes(flight.id)),
          ...flights
        ]
      }
    }),
    setActiveId: rxMethod<number>(pipe(
      tapResponse(
        activeFlightId => patchState(store, { activeFlightId }),
        err => console.error(err)
      )
    )),
    // Creates a local cache, but EntityState would allow more performat updates
    updateFlight: (updatedFlight: Flight) => patchState(store, state => {
      let isNewFlight = true;
      return { flights: [
        ...state.flights.map(flight => {
          if (flight.id === updatedFlight.id) {
            isNewFlight = false;
            return updatedFlight;
          }
          return flight;
        }),
        ...(isNewFlight ? [updatedFlight] : [])
      ]};
    }),
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
        .subscribe(flights => store.updateFlights(flights));
    },
    _loadRxFlights: rxMethod<FlightFilter>(pipe(
      switchMap(filter => flightService.find(
        filter.from, filter.to, filter.urgent
      )),
      tapResponse(
        flights => store.updateFlights(flights),
        err => console.error(err)
      )
    )),
    _loadRxFlightById: rxMethod<number>(pipe(
      filter(id => !!id),
      switchMap(id => flightService.findById(id)),
      tapResponse(
        flight => flight && store.updateFlight(flight),
        err => console.error(err)
      )
    )),
    // Pessimistic Update: Frontend state is updated after successful server response
    saveFlightUpdate: rxMethod<Flight>(pipe(
      switchMap(flight => flightService.save(flight)),
      tapResponse(
        flight => store.updateFlight(flight),
        err => console.error(err)
      )
    ))
  })),
  withHooks({
    onInit: store => {
      store._loadRxFlights(store.filter);
      store._loadRxFlightById(store.activeFlightId);
    }
  })
);
