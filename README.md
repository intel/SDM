# Intel&reg; 64 and IA-32 Architectures Software Developer’s Manual website

This [website](https://intel.github.io/SDM/sdm.html) is a preview of how Intel intends to document and present
the Intel&reg; Architecture in the future.

This preview is provided to enable feedback and it may change radically
in response to any feedback received.


See
[Notices and Disclaimers](notices-and-disclaimers.md)
for terms of use.

This is only a preview to enable feedback;
see the
[Intel&reg; 64 and IA-32 Architectures Software Development Manual](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
book for the official description of the Intel&reg; Architecture.

The following steps will let you view this website on your local machine.

Start by following OS-specific instructions to install Jekyll dependencies
such as https://jekyllrb.com/docs/installation/ubuntu/.
If working behind a firewall, you may have to use the -p flag (with 'gem')
or the `HTTP_PROXY` environment variable to specify an HTTP proxy.
Then follow the following steps.

``` bash
# Avoid the need for root access to install Jekyll
bundle config set --local path 'vendor/bundle'

# Install Jekyll and all of its dependencies
bundle install

# Run the web server.
# This will suggest a local URL such as http://127.0.0.1:4000/ to open
# in your browser.
bundle exec jekyll serve
```

© Intel Corporation.
