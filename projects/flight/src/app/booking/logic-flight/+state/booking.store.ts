import { signalStore, withState } from "@ngrx/signals";
import { FlightFilter } from "../model/flight-filter";
import { Flight } from "../model/flight";

export const BookingStore = signalStore(
  { providedIn: 'root' },
  withState({
    filter: {
      from: 'London',
      to: 'Paris',
      urgent: false
    } as FlightFilter,
    basket: {
      3: true,
      5: true,
    } as Record<number, boolean>,
    flights: [] as Flight[]
  })
);
