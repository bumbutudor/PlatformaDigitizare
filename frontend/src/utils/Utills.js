const mapPeriod = (period) => {
    switch (period) {
        case "secolulXX":
            return "5";
        case "secolulXIX":
            return "4";
        case "secolulXVIII":
            return "3";
        case "secolulXVII":
            return "2";
    }
}

const mapPeriodBack = (period) => {
    switch (period) {
        case "5":
            return "secolulXX";
        case "4":
            return "secolulXIX";
        case "3":
            return "secolulXVIII";
        case "2":
            return "secolulXVII";
    }
}

export { mapPeriod, mapPeriodBack };