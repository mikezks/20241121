import { computed, inject } from "@angular/core";
import { tapResponse } from "@ngrx/operators";
import { patchState, signalStore, type, withComputed, withHooks, withMethods, withState } from "@ngrx/signals";
import { setAllEntities, setEntities, setEntity, withEntities } from "@ngrx/signals/entities";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { filter, pipe, switchMap } from "rxjs";
import { Flight, initialFlight } from "../model/flight";
import { FlightFilter } from "../model/flight-filter";
import { FlightService } from './../data-access/flight.service';

type BookingState = {
  filter: FlightFilter;
  basket: Record<number, boolean>;
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
  activeFlightId: 0,
};

export const BookingStore = signalStore(
  { providedIn: 'root' },
  /**
   * State Definition
   */
  withState(initialBookingState),
  withEntities({ entity: type<Flight>(), collection: 'flight' }),
  /**
   * Derived State
   */
  withComputed(store => ({
    // Because of the local cache, Flight Search Component needs to read flights that match the filter (not all)
    filteredFlights: computed(
      () => store.flightEntities().filter(flight =>
        flight.from.startsWith(store.filter.from())
        && flight.to.startsWith(store.filter.to())
      )
    ),
    selectedFlights: computed(
      () => store.flightEntities().filter(flight => store.basket()[flight.id])
    ),
    delayedFlights: computed(
      () => store.flightEntities().filter(flight => flight.delayed)
    ),
    route: computed(
      () => 'From ' + store.filter().from + ' to ' + store.filter().to + '.'
    ),
    activeFlight: computed(
      () => store.flightEntities().find(flight => flight.id === store.activeFlightId()) || initialFlight
    )
  })),
  /**
   * Updater
   */
  withMethods(store => ({
    setFilter: (filter: FlightFilter) => patchState(store, { filter }),
    // Creates a local cache w/ more performat EntityState data structure
    setFlights: (flights: Flight[]) => patchState(store,
      setEntities(flights, { collection: 'flight' })),
    // Creates a local cache w/ more performat EntityState data structure
    setFlight: (flight: Flight) => patchState(store,
      setEntity(flight, { collection: 'flight' })),
    setActiveId: rxMethod<number>(pipe(
      tapResponse(
        activeFlightId => patchState(store, { activeFlightId }),
        err => console.error(err)
      )
    )),
    setBasketId: (id: number, selected: boolean) => patchState(store, state => ({
      basket: {
        ...state.basket,
        [id]: selected
      }
    })),
    resetFlights: () => patchState(store,
      setAllEntities([] as Flight[], { collection: 'flight' })),
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
    _loadRxFlights: rxMethod<FlightFilter>(pipe(
      switchMap(filter => flightService.find(
        filter.from, filter.to, filter.urgent
      )),
      tapResponse(
        flights => store.setFlights(flights),
        err => console.error(err)
      )
    )),
    _loadRxFlightById: rxMethod<number>(pipe(
      filter(id => !!id),
      switchMap(id => flightService.findById(id)),
      tapResponse(
        flight => flight && store.setFlight(flight),
        err => console.error(err)
      )
    )),
    // Pessimistic Update: Frontend state is updated after successful server response
    saveFlightUpdate: rxMethod<Flight>(pipe(
      switchMap(flight => flightService.save(flight)),
      tapResponse(
        flight => store.setFlight(flight),
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
