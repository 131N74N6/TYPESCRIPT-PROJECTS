import Storage from "./storage";
import type { Product } from "./types";

const dataStorage = Storage<Product>("products");

dataStorage.insert;