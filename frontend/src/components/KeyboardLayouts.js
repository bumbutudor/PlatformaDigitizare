
export default {
    /**
    * Layout: Soviet cyrillic
    */
    cyrillic: {
        layout: {
            default: [
                "` 1 2 3 4 5 6 7 8 9 0 - = {bksp}",
                "{tab} \u0439 \u0446 \u0443 \u043a \u0435 \u043d \u0433 \u0448 \u0449 \u0437 \u0445 \u044a \u044d",
                "{lock} \u0444 \u044b \u0432 \u0430 \u043f \u0440 \u043e \u043b \u0434 \u0436 \u04c2 {enter}",
                "{shift} / \u044f \u0447 \u0441 \u043c \u0438 \u0442 \u044c \u0431 \u044e . {shift}",
                ".com @ {space}",
            ],
            shift: [
                '~ ! " \u2116 ; % : ? * ( ) _ + {bksp}',
                "{tab} \u0419 \u0426 \u0423 \u041a \u0415 \u041d \u0413 \u0428 \u0429 \u0417 \u0425 \u042a \u042d",
                "{lock} \u0424 \u042b \u0412 \u0410 \u041f \u0420 \u041e \u041b \u0414 \u0416 \u04c1 {enter}",
                "{shift} | \u042f \u0427 \u0421 \u041c \u0418 \u0422 \u042c \u0411 \u042e , {shift}",
                ".com @ {space}",
            ],
        }
    },


    /**
    * Layout: Romanian Transitional alphabet
    */

    cyrillicTransitional: {
        layout: {
            default: [
                "` 1 2 3 4 5 6 7 8 9 0 - = {bksp}",
                "{tab} ѳ ѡ е р т t ї ĭ ꙋ i о п ъ ꙟ ѫ î",
                "{lock} а с d ф г х ж к л ц ш щ џ ' {enter}",
                "{shift} з ѯ ч в б n m ѣ ѧ ѩ ю ѹ ь ѵ ѱ ѕ . / {shift}",
                "{space}"
            ],
            shift: [
                "~ ! @ # $ % ^ & * ( ) _ + {bksp}",
                "{tab} Ѳ Ѡ Е Р Т Ї Ĭ Ꙋ И О П Ъ Ꙟ Ѫ Î",
                '{lock} А С Д Ф Г Х Ж К Л Ц Ш Щ Џ " {enter}',
                "{shift} З Ѯ Ч В Б Н М Ѣ Ѧ Ѩ Ю ОУ Ь Ѵ Ѱ Ѕ {shift}",
                "{space}"
            ]

        }
    },

    /**
    * Layout: Romanian Cyrrilic
    */

    cyrillicRomanian: {
        layout: {
            default: [
                "` 1 2 3 4 5 6 7 8 9 0 - = {bksp}",
                "{tab} ѳ ѡ е р т ї ꙋ и о п ъ ꙟ ѫ",
                "{lock} а с д ф г х ж к л ц ш щ џ ' {enter}",
                "{shift} з ѯ ч в б н м ѣ ѧ ѩ ю ѹ ь ѵ ѱ ѕ . / {shift}",
                "{space}"
            ],
            shift: [
                "~ ! @ # $ % ^ & * ( ) _ + {bksp}",
                "{tab} Ѳ Ѡ Е Р Т Ї Ꙋ И О П Ъ Ꙟ Ѫ",
                '{lock} А С Д Ф Г Х Ж К Л Ц Ш Щ Џ " {enter}',
                "{shift} З Ѯ Ч В Б Н М Ѣ Ѧ Ѩ Ю ОУ Ь Ѵ Ѱ Ѕ {shift}",
                "{space}"
            ]

        }
    },


    /**
     * Layout: Romanian Latin
     */
    latin: {
        layout: {
            default: [
                "` 1 2 3 4 5 6 7 8 9 0 - = {bksp}",
                "{tab} q w e r t y u i o p ă î â \\",
                "{lock} a s d f g h j k l ș ț ' {enter}",
                "{shift} z x c v b n m , . / {shift}",
                "{space}",
            ],
            shift: [
                "~ ! @ # $ % ^ & * ( ) _ + {bksp}",
                "{tab} Q W E R T Y U I O P Ă Î Â",
                '{lock} A S D F G H J K L Ț Ș " {enter}',
                "{shift} Z X C V B N M < > ? {shift}",
                "{space}",
            ],
        },
    }


};