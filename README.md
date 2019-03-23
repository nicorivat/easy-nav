# EASY NAV

Make keyboard navigation and accessibility easy again.

This script will allows you to define, by a simple array of objects, a flatten map of your elements to represent the keyboard navigation. Each element will have to be defined by a classic id to help the script to find them easily. Furthermore, you will have to specify a type to each of your elements (INPUT, BUTTON, LIST, ...) to a set a specific behavior to your element. On a change route, the script will parse your array of elements to find them in the DOM and create a tabindex list (starting from 0). All other elements will have a tabindex set to -1 to prevent unwanted behaviors. When a mutation is observed in the DOM, the script will re-run the search to find new elements or to remove the destroyed ones.

What about accessibility dude ?

By specifying a type to your element in your array of elements, the script will automaticaly add basics aria roles. For example, if your element have a BUTTON type, the script will add "role=button" to the element. If you want to add specific roles to your element, you have the possibility to add them with the "attributes" array. What's the purpose of that ? The purpose is to have all your accessibility logic at the same place avoiding to go in all your potential HTML files.

## Usage

You will need Node.js installed on your system.

```shell
$ npm install easy-nav --save
```

Example of Keyboard Navigation object:

```ts
import { Navigation, ElementList, ElementType } from 'easy-nav';

export const NavigationConfig = {
    general: {
        header: [
            {
                id: 'home-button',
                type: ElementType.BUTTON
            }
        ],
        footer: []
    },
    routes: [
        {
            path: 'home',
            elements: [
                {
                    id: 'home-title',
                    type: ElementType.LABEL
                }
            ]
        }
    ]
}
```

Then in your main component (example made with Angular):

```ts
import { KeyboardNavigation } from 'easy-nav';
import { NavigationConfig } from '...' // Import your navigation object.
...

@Component({
    ...
})
export class AppComponent implements OnInit, OnDestroy {
    private navigation = new KeyboardNavigation();
    private readonly _destroy$ = new Subject();
    ...

    constructor(private router: Router) { }

    ngOnInit() {
        this.navigation.init(NavigationConfig); // Init the script with your configuration.
        this.router.events.pipe(takeUntil(this._destroy$)).subscribe(route => {
            if (route instanceof NavigationEnd)
                this.navigation.onChangeRoute(route.url);
                // You have to call onChangeRoute method when a navigation occured.
        })
    }

    ...
}
```

And that's all folks !!

### Prerequisites

What things you need to install the software and how to install them

```
Give examples
```

### Installing

A step by step series of examples that tell you how to get a development env running

Say what the step will be

```
Give the example
```

And repeat

```
until finished
```

End with an example of getting some data out of the system or using it for a little demo

## Running the tests

Explain how to run the automated tests for this system

### Break down into end to end tests

Explain what these tests test and why

```
Give an example
```

### And coding style tests

Explain what these tests test and why

```
Give an example
```

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Dropwizard](http://www.dropwizard.io/1.0.2/docs/) - The web framework used
* [Maven](https://maven.apache.org/) - Dependency Management
* [ROME](https://rometools.github.io/rome/) - Used to generate RSS Feeds

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). 

## Authors

* **Billie Thompson** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone whose code was used
* Inspiration
* etc
