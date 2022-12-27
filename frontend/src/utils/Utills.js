const mapPeriod = (period) => {
    switch (period) {
        case "secolulXX":
            return "1";
        case "secolulXIX":
            return "2";
        case "secolulXVIII":
            return "3";
        case "secolulXVII":
            return "4";
    }
}

const mapPeriodBack = (period) => {
    switch (period) {
        case "1":
            return "secolulXX";
        case "2":
            return "secolulXIX";
        case "3":
            return "secolulXVIII";
        case "4":
            return "secolulXVII";
    }
}

export { mapPeriod, mapPeriodBack };