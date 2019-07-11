package umc.cdc.hds.httpserver;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InterruptedIOException;
import java.net.URL;
import java.util.Collections;
import java.util.Map;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletResponse;

import com.google.common.collect.ImmutableMap;

import org.mortbay.jetty.Handler;
import org.mortbay.jetty.Server;
import org.mortbay.jetty.SessionManager;
import org.mortbay.jetty.handler.ContextHandlerCollection;
import org.mortbay.jetty.servlet.AbstractSessionManager;
import org.mortbay.jetty.servlet.Context;
import org.mortbay.jetty.servlet.DefaultServlet;
import org.mortbay.jetty.servlet.FilterHolder;
import org.mortbay.jetty.servlet.SessionHandler;
import org.mortbay.jetty.servlet.FilterMapping;
import org.mortbay.jetty.servlet.ServletHandler;
import org.mortbay.jetty.servlet.ServletHolder;
import org.mortbay.jetty.webapp.WebAppContext;
import org.mortbay.util.MultiException;

public class HdsUiServer
{
	private final Server server;
	private final WebAppContext webAppContext;

	public static class NoCacheFilter implements Filter {
		@Override
		public void init(FilterConfig filterConfig) throws ServletException {
		}

		@Override
		public void doFilter(ServletRequest req, ServletResponse res,
				FilterChain chain)
			throws IOException, ServletException {
			HttpServletResponse httpRes = (HttpServletResponse) res;
			httpRes.setHeader("Cache-Control", "no-cache");
			long now = System.currentTimeMillis();
			httpRes.addDateHeader("Expires", now);
			httpRes.addDateHeader("Date", now);
			httpRes.addHeader("Pragma", "no-cache");
			chain.doFilter(req, res);
		}

		@Override
		public void destroy() {
		}
	}

	public HdsUiServer () throws IOException {
		final String name = "hds";
		final String appDir = getWebAppsPath(name);
		this.server = new Server(getPort());
		this.webAppContext = createWebAppContext(name, appDir);
		initializeServer(appDir);
	}

	public void start() throws Exception {
		try {
			try {
				server.start();
			} catch (IOException ex) {
				throw ex;
			} catch (MultiException ex) {
				throw ex;
			}
			// Make sure there is no handler failures.
			Handler[] handlers = server.getHandlers();
			for (Handler handler : handlers) {
				if (handler.isFailed()) {
					throw new IOException(
							"Problem in starting ui server. Server handlers failed");
				}
			}
			// Make sure there are no errors initializing the context.
			Throwable unavailableException = webAppContext.getUnavailableException();
			if (unavailableException != null) {
				// Have to stop the webserver, or else its non-daemon threads
				// will hang forever.
				server.stop();
				throw new IOException("Unable to initialize WebAppContext",
						unavailableException);
			}
		} catch (IOException e) {
			throw e;
		} catch (InterruptedException e) {
			throw (IOException) new InterruptedIOException(
					"Interrupted while starting HTTP server").initCause(e);
		} catch (Exception e) {
			throw new IOException("Problem starting http server", e);
		}
	}

	// return the path ends with "webapps"
	private String getWebAppsPath(final String appName)
			throws FileNotFoundException {
		URL url = getClass().getClassLoader().getResource("webapps/" + appName);
		if (url == null)
			throw new FileNotFoundException("webapps/" + appName
					+ " not found in CLASSPATH");
		String urlString = url.toString();
		System.out.println("webapps path = " + urlString.substring(0, urlString.lastIndexOf('/')));
		return urlString.substring(0, urlString.lastIndexOf('/'));
		//return urlString.substring(0, urlString.lastIndexOf('/'));
	}

	// conf not passed yet
	private int getPort() {
		return 8080;
	}

	private WebAppContext createWebAppContext(final String name,
			final String appDir) {
		WebAppContext ctx = new WebAppContext();
		// a web.xml applied before standard WEB-INF/web.xml
		ctx.setDefaultsDescriptor(null);
		ServletHolder holder = new ServletHolder(new DefaultServlet());
		Map<String, String> params = ImmutableMap.<String, String> builder()
			// range requests and responses are supported
			.put("acceptRanges", "true")
			// directory listings are not returned if no welcome file is found
			.put("dirAllowed", "false")
			// static content will be served as gzip content encoded if a
			// matching resource is found ending with ".gz"
			.put("gzip", "true")
			// it will use mapped file buffer to serve static content when using
			// NIO connector.
			.put("useFileMappedBuffer", "true")
			.build();
		holder.setInitParameters(params);
		ctx.setWelcomeFiles(new String[] {"index.html"});
		ctx.addServlet(holder, "/");
		ctx.setDisplayName(name);
		ctx.setContextPath("/");
		//ctx.setWar(appDir + "/" + name);
		ctx.setResourceBase(appDir + "/" + name);

		addNoCacheFilter(ctx);

		return ctx;
	}

	private static void addNoCacheFilter(WebAppContext ctx) {
		FilterHolder fHolder = new FilterHolder();
		FilterMapping fMapping = new FilterMapping();

		fHolder.setName("NoCacheFilter");
		fHolder.setClassName(HdsUiServer.NoCacheFilter.class.getName());
		fHolder.setInitParameters(Collections.<String, String> emptyMap());

		fMapping.setPathSpecs(new String[] { "/*" });
		fMapping.setDispatches(Handler.ALL);
		fMapping.setFilterName("NoCacheFilter");

		ServletHandler handler = ctx.getServletHandler();
		handler.addFilter(fHolder, fMapping);
	}

	private void initializeServer(final String appDir) {
		ContextHandlerCollection contexts = new ContextHandlerCollection();
		server.setHandler(contexts);
		server.addHandler(webAppContext);
		addDefaultApps(contexts, appDir);
	}

	private void addDefaultApps(ContextHandlerCollection parent,
			final String appDir) {
		Context staticContext = new Context(parent, "/static");
		staticContext.setResourceBase(appDir + "/static");
		staticContext.addServlet(DefaultServlet.class, "/*");
		staticContext.setDisplayName("static");
		@SuppressWarnings("unchecked")
		Map<String, String> params = staticContext.getInitParams();
		params.put("org.mortbay.jetty.servlet.Default.dirAllowed", "false");
		SessionHandler handler = new SessionHandler();
		SessionManager sm = handler.getSessionManager();
		if (sm instanceof AbstractSessionManager) {
			AbstractSessionManager asm = (AbstractSessionManager) sm;
			asm.setHttpOnly(true);
			asm.setSecureCookies(true);
		}
		staticContext.setSessionHandler(handler);
	}

	public static void main(String[] args) {
		try {
			HdsUiServer server = new HdsUiServer();
			server.start();
		} catch (Exception e) {
			System.out.println(e);
			System.exit(1);
		}
	}
}
